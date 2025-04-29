
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const langchainService = {
  analyzeRepositoryWithLangChain: async (content, user) => {
    try {
      console.log("Analyzing repository:", content);
      
      // Extract owner and repo from URL or text
      // Support both github.com URLs and owner/repo format
      let owner, repo;
      
      // Check for GitHub URL format (with more flexible parsing)
      const urlPattern = /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i;
      const urlMatch = content.match(urlPattern);
      
      // Check for owner/repo format
      const shortPattern = /(?:^|\s)([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\s|$)/i;
      const shortMatch = content.match(shortPattern);
      
      if (urlMatch && urlMatch.length >= 3) {
        owner = urlMatch[1];
        repo = urlMatch[2].replace(/\.git$/, ''); // Remove .git if present
        // Clean up repo name - remove query params, hash, or other trailing characters
        repo = repo.split(/[?#/]/)[0];
      } else if (shortMatch && shortMatch.length >= 3) {
        owner = shortMatch[1];
        repo = shortMatch[2].replace(/\.git$/, ''); // Remove .git if present
        // Clean up repo name
        repo = repo.split(/[?#/]/)[0];
      } else {
        console.error("Could not extract repository information from:", content);
        toast.error("Invalid repository format", {
          description: "Please provide a valid GitHub repository in the format 'owner/repo' or as a URL"
        });
        return "I couldn't parse the GitHub repository information. Please provide it in the format 'owner/repo' or as a GitHub URL like 'https://github.com/owner/repo'.";
      }
      
      console.log(`Extracted repo details: ${owner}/${repo}`);
      
      // Call the GitHub analysis function
      try {
        const { data: repoData, error: repoError } = await supabase.functions.invoke('analyze-repo', {
          body: { owner, repo }
        });

        if (repoError) {
          console.error("Error invoking analyze-repo function:", repoError);
          toast.error("Analysis failed", {
            description: repoError.message || "Could not analyze the repository"
          });
          return `I encountered an error while analyzing the repository "${owner}/${repo}". Please check if the repository exists and is public.`;
        }
        
        // Check for error in the response
        if (repoData && repoData.error) {
          console.error("Repository analysis error:", repoData.error);
          toast.error(repoData.errorType === "NOT_FOUND" ? "Repository not found" : "GitHub API error", {
            description: repoData.error
          });
          
          // Suggest a corrected repo name if NOT_FOUND
          if (repoData.errorType === "NOT_FOUND") {
            return `I couldn't find the repository "${owner}/${repo}". Please check that the repository exists, is public, and the owner/repo name is correct. Make sure you spelled the repository name correctly.`;
          }
          
          return `I encountered an error analyzing the repository: ${repoData.error}`;
        }

        if (!repoData) {
          console.error("No data returned from analyze-repo function");
          toast.error("Analysis failed", {
            description: "No data returned from the analysis"
          });
          return "I encountered an error while analyzing the repository. Please try again.";
        }

        // Format the analysis response to match desired output
        const response = `
Analysis of ${owner}/${repo}
Repository Statistics
Stars: ${repoData.repoData.stars.toLocaleString()}
Forks: ${repoData.repoData.forks.toLocaleString()}
Open Issues: ${repoData.repoData.issues.toLocaleString()}
Contributors: ${repoData.repoData.contributors}
Last Updated: ${new Date(repoData.repoData.lastUpdated).toLocaleDateString()}
Evaluation Scores
Community Support: ${repoData.communityScore.toFixed(1)}/100
Documentation Quality: ${repoData.docQualityScore.toFixed(1)}/100
Activity Level: ${repoData.activityScore.toFixed(1)}/100
Overall Score: ${repoData.overallScore.toFixed(1)}/100
Documentation
README: ${repoData.repoData.hasReadme ? '✅ Present' : '❌ Missing'}
Contributing Guidelines: ${repoData.repoData.hasContributing ? '✅ Present' : '❌ Missing'}
Issue Templates: ${repoData.repoData.hasIssueTemplates ? '✅ Present' : '❌ Missing'}
Analysis Summary
${repoData.overallScore > 80 ? 'This is an excellent repository with strong community support and documentation.' :
  repoData.overallScore > 60 ? 'This is a good repository with decent community support.' :
  repoData.overallScore > 40 ? 'This repository has some challenges but may still be useful depending on your needs.' :
  'This repository shows signs of low activity or limited documentation. Consider alternative options.'}`;

        console.log("Repository analysis completed successfully");
        return response;
      } catch (e) {
        console.error("Error in repository analysis:", e);
        toast.error("Analysis failed", {
          description: e.message || "Please try again later"
        });
        return `I encountered an error while analyzing the repository "${owner}/${repo}". ${e.message || "Please try again."}`;
      }
    } catch (e) {
      console.error("Failed to analyze repository:", e);
      toast.error("Analysis failed", {
        description: e.message || "Please try again later"
      });
      return "I encountered an error while analyzing the repository. Please try again.";
    }
  }
};
