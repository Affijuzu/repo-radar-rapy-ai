import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function to extract repository owner and name from a message
function extractRepoInfo(message) {
  const repoPattern = /(?:github\.com\/)?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
  const match = message.match(repoPattern);
  
  if (match && match.length >= 3) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  
  return null;
}

// Function to generate a default response
function getDefaultResponse() {
  return "I'm Rapy, your GitHub repository analysis assistant! I can help you evaluate open-source projects based on metrics like stars, activity, community support, and documentation quality.\n\nTo analyze a repository, simply mention it in your message like 'facebook/react' or ask me about specific technologies like 'What are the most active React state management libraries?'";
}

// Function to format repository analysis as markdown
function formatRepoAnalysis(repoInfo, analysis, userMemory) {
  console.log("Formatting repo analysis for", repoInfo.owner + "/" + repoInfo.repo);
  return `Analysis of ${repoInfo.owner}/${repoInfo.repo}
Repository Statistics
Stars: ${analysis.repoData.stars.toLocaleString()}
Forks: ${analysis.repoData.forks.toLocaleString()}
Open Issues: ${analysis.repoData.issues.toLocaleString()}
Contributors: ${analysis.repoData.contributors}
Last Updated: ${new Date(analysis.repoData.lastUpdated).toLocaleDateString()}
Evaluation Scores
Community Support: ${analysis.communityScore.toFixed(1)}/100
Documentation Quality: ${analysis.docQualityScore.toFixed(1)}/100
Activity Level: ${analysis.activityScore.toFixed(1)}/100
Overall Score: ${analysis.overallScore.toFixed(1)}/100
Documentation
README: ${analysis.repoData.hasReadme ? '✅ Present' : '❌ Missing'}
Contributing Guidelines: ${analysis.repoData.hasContributing ? '✅ Present' : '❌ Missing'}
Issue Templates: ${analysis.repoData.hasIssueTemplates ? '✅ Present' : '❌ Missing'}
Analysis Summary
${analysis.overallScore > 80 ? 'This is an excellent repository with strong community support and documentation.' :
  analysis.overallScore > 60 ? 'This is a good repository with decent community support.' :
  analysis.overallScore > 40 ? 'This repository has some challenges but may still be useful depending on your needs.' :
  'This repository shows signs of low activity or limited documentation. Consider alternative options.'}
${userMemory?.repoEvaluations?.length > 0 ? 
  'Comparison with Previously Evaluated Repos\n' + 
  compareWithPreviousEvaluations(analysis, userMemory.repoEvaluations) : ''}`;
}

// Function to compare with previous evaluations
function compareWithPreviousEvaluations(analysis, previousEvaluations) {
  if (!previousEvaluations || previousEvaluations.length === 0) {
    return '';
  }
  
  const avgCommunity = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.communityScore, 0) / previousEvaluations.length;
  const avgDocs = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.docQualityScore, 0) / previousEvaluations.length;
  const avgActivity = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.activityScore, 0) / previousEvaluations.length;
  const avgOverall = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.overallScore, 0) / previousEvaluations.length;
  
  const communityComparison = analysis.communityScore > avgCommunity ? 'higher' : 'lower';
  const docsComparison = analysis.docQualityScore > avgDocs ? 'higher' : 'lower';
  const activityComparison = analysis.activityScore > avgActivity ? 'higher' : 'lower';
  const overallComparison = analysis.overallScore > avgOverall ? 'higher' : 'lower';
  
  return `Compared to your previously analyzed repositories:
- Community support is ${communityComparison} than average (${avgCommunity.toFixed(1)})
- Documentation quality is ${docsComparison} than average (${avgDocs.toFixed(1)})
- Activity level is ${activityComparison} than average (${avgActivity.toFixed(1)})
- Overall score is ${overallComparison} than average (${avgOverall.toFixed(1)})`;
}

// Function to format repositories search results as markdown
function formatLibrariesSearch(repositories, userMemory) {
  return `# React State Management Libraries

Based on my analysis, here are the top React state management libraries:

${repositories.map((repo, index) => `
## ${index + 1}. ${repo.name} (${repo.owner})
- **Stars:** ${repo.stars.toLocaleString()}
- **Forks:** ${repo.forks.toLocaleString()}
- **Open Issues:** ${repo.issues.toLocaleString()}
- **URL:** ${repo.url}
- **Description:** ${repo.description || 'No description available'}
`).join('\n')}

${userMemory?.userPreferences?.preferredLanguages?.includes('javascript') || 
  userMemory?.userPreferences?.frameworks?.includes('react') ?
  "\nBased on your preferences, I've prioritized React libraries that align with your interests." : ""}
`;
}

// Function to format previous evaluations as markdown
function formatPreviousEvaluations(repoEvaluations) {
  return `# Previously Analyzed Repositories

Based on your history, you've analyzed the following repositories:

${repoEvaluations.map((repoEval, index) => `
## ${index + 1}. ${repoEval.owner}/${repoEval.repoName}
- **Evaluated on:** ${new Date(repoEval.evaluationDate).toLocaleDateString()}
- **Stars:** ${repoEval.stars.toLocaleString()}
- **Overall Score:** ${repoEval.overallScore.toFixed(1)}/100
- **Community Score:** ${repoEval.communityScore.toFixed(1)}/100
- **Documentation Score:** ${repoEval.docQualityScore.toFixed(1)}/100
- **Activity Score:** ${repoEval.activityScore.toFixed(1)}/100
`).join('\n')}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("generate-response: Received request");

  try {
    // Get request body
    const { content, userId, userMemory } = await req.json();
    console.log("Processing request for content:", content?.substring(0, 50) + "...");
    
    // Create Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Check if message contains a repository reference
    const repoInfo = extractRepoInfo(content);
    console.log("Extracted repo info:", repoInfo);
    
    if (repoInfo) {
      try {
        // Invoke analyze-repo function
        console.log(`Invoking analyze-repo for ${repoInfo.owner}/${repoInfo.repo}`);
        const { data: analysis, error } = await supabaseAdmin.functions.invoke("analyze-repo", {
          body: { owner: repoInfo.owner, repo: repoInfo.repo }
        });
        
        if (error) {
          console.error("Error invoking analyze-repo:", error);
          throw error;
        }
        
        // Check if the response contains an error
        if (analysis && analysis.error) {
          console.log("Repository analysis error:", analysis.error);
          
          // Return appropriate error message
          if (analysis.errorType === "NOT_FOUND") {
            return new Response(
              JSON.stringify({ 
                response: `I couldn't find the repository "${repoInfo.owner}/${repoInfo.repo}". Please check that the repository exists and the owner/repo name is correct.`,
                error: analysis.error,
                errorType: analysis.errorType
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            return new Response(
              JSON.stringify({ 
                response: `I encountered an error while analyzing the repository: ${analysis.error}`,
                error: analysis.error,
                errorType: analysis.errorType
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
        
        console.log("Analysis completed successfully");
        
        if (analysis && userId) {
          // Store this evaluation in database
          console.log("Storing evaluation in database for user:", userId);
          const { error: dbError } = await supabaseAdmin
            .from('repo_analyses')
            .insert({
              user_id: userId,
              repo_name: repoInfo.repo,
              owner: repoInfo.owner,
              stars: analysis.repoData.stars,
              forks: analysis.repoData.forks,
              issues: analysis.repoData.issues,
              contributors: analysis.repoData.contributors,
              commit_frequency: analysis.repoData.commitFrequency,
              community_score: analysis.communityScore,
              doc_quality_score: analysis.docQualityScore,
              activity_score: analysis.activityScore,
              overall_score: analysis.overallScore
            });
          
          if (dbError) {
            console.error("Error storing repo analysis:", dbError);
          } else {
            console.log("Evaluation stored successfully");
          }
        }
        
        // Format the analysis response
        const response = formatRepoAnalysis(repoInfo, analysis, userMemory);
        
        return new Response(
          JSON.stringify({ response }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (e) {
        console.error("Failed to analyze repository", e);
        return new Response(
          JSON.stringify({ 
            response: `I encountered an error while analyzing the repository "${repoInfo.owner}/${repoInfo.repo}". ${e.message}`,
            error: e.message
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Check for specific requests about libraries
    if (content.toLowerCase().includes("react state") && 
        (content.toLowerCase().includes("library") || content.toLowerCase().includes("libraries"))) {
      
      console.log("Processing request for React state management libraries");
      try {
        // Search for React state management libraries
        const { data: searchData, error } = await supabaseAdmin.functions.invoke("analyze-repo", {
          body: { searchQuery: "react state management library" }
        });
        
        if (error) {
          console.error("Error searching repositories:", error);
          throw error;
        }
        
        if (searchData && searchData.searchResults && searchData.searchResults.length > 0) {
          console.log(`Found ${searchData.searchResults.length} libraries`);
          const response = formatLibrariesSearch(searchData.searchResults, userMemory);
          
          return new Response(
            JSON.stringify({ response }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (e) {
        console.error("Error searching repositories:", e);
      }
    }
    
    // If user has memory and asks about previous evaluations
    if (content.toLowerCase().includes("previous") && 
        (content.toLowerCase().includes("evaluation") || content.toLowerCase().includes("repository") || 
         content.toLowerCase().includes("repo") || content.toLowerCase().includes("analyzed"))) {
      
      console.log("Processing request for previous evaluations");
      if (userMemory && userMemory.repoEvaluations && userMemory.repoEvaluations.length > 0) {
        console.log(`Found ${userMemory.repoEvaluations.length} previous evaluations`);
        const response = formatPreviousEvaluations(userMemory.repoEvaluations);
        
        return new Response(
          JSON.stringify({ response }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.log("No previous evaluations found");
        return new Response(
          JSON.stringify({ 
            response: "I don't have any record of previously analyzed repositories. Let's analyze one now! Just mention a GitHub repository like 'owner/repo' in your message."
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    
    // Default response when no specific pattern is matched
    console.log("No specific pattern matched, returning default response");
    return new Response(
      JSON.stringify({ response: getDefaultResponse() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-response function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "Sorry, I encountered an error processing your request. Please try again."
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
