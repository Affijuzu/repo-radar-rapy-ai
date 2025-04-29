
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const langchainService = {
  analyzeRepositoryWithLangChain: async (content, user) => {
    try {
      console.log("Analyzing repository:", content);
      
      // Extract owner and repo from URL or text
      const repoPattern = /github\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
      const match = content.match(repoPattern);
      
      if (!match || match.length < 3) {
        console.error("Could not extract repository information from:", content);
        toast.error("Invalid repository URL", {
          description: "Please provide a valid GitHub repository URL"
        });
        return "I couldn't parse the GitHub repository URL. Please provide it in the format 'https://github.com/owner/repo'.";
      }
      
      const owner = match[1];
      const repo = match[2];
      
      console.log(`Extracted repo details: ${owner}/${repo}`);
      
      // Call the GitHub service directly to avoid edge function issues
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
          return `I couldn't find the repository "${owner}/${repo}". Please check that the repository exists, is public, and the owner/repo name is correct.`;
        }

        if (!repoData) {
          console.error("No data returned from analyze-repo function");
          toast.error("Analysis failed", {
            description: "No data returned from the analysis"
          });
          return "I encountered an error while analyzing the repository. Please try again.";
        }

        // Format the analysis response
        const response = `
        # Analysis of ${owner}/${repo}

        ## Repository Statistics
        - Stars: ${repoData.repoData.stars.toLocaleString()}
        - Forks: ${repoData.repoData.forks.toLocaleString()}
        - Open Issues: ${repoData.repoData.issues.toLocaleString()}
        - Contributors: ${repoData.repoData.contributors}
        - Last Updated: ${new Date(repoData.repoData.lastUpdated).toLocaleDateString()}

        ## Evaluation Scores
        - Community Support: ${repoData.communityScore.toFixed(1)}/100
        - Documentation Quality: ${repoData.docQualityScore.toFixed(1)}/100
        - Activity Level: ${repoData.activityScore.toFixed(1)}/100
        - Overall Score: ${repoData.overallScore.toFixed(1)}/100

        ## Documentation
        - README: ${repoData.repoData.hasReadme ? '✅ Present' : '❌ Missing'}
        - Contributing Guidelines: ${repoData.repoData.hasContributing ? '✅ Present' : '❌ Missing'}
        - Issue Templates: ${repoData.repoData.hasIssueTemplates ? '✅ Present' : '❌ Missing'}

        ## Analysis Summary
        ${repoData.overallScore > 80 ? 'This is an excellent repository with strong community support and documentation.' :
          repoData.overallScore > 60 ? 'This is a good repository with decent community support.' :
          repoData.overallScore > 40 ? 'This repository has some challenges but may still be useful depending on your needs.' :
          'This repository shows signs of low activity or limited documentation. Consider alternative options.'}
        `;

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
