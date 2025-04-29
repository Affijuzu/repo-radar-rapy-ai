
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const langchainService = {
  analyzeRepositoryWithLangChain: async (content, user) => {
    try {
      console.log("Analyzing repository:", content);
      
      // Call the analyze-repo edge function to get repository data
      const { data: repoData, error: repoError } = await supabase.functions.invoke('analyze-repo', {
        body: { content }
      });

      if (repoError || !repoData) {
        console.error("Error fetching repository data:", repoError);
        return "I encountered an error while analyzing the repository. Please try again.";
      }

      // Format the analysis response directly
      const response = `
      # Analysis of ${repoData.repoData.owner}/${repoData.repoData.repo}

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

      console.log("Repository analysis completed");
      return response;

    } catch (e) {
      console.error("Failed to analyze repository:", e);
      toast.error("Analysis failed", {
        description: e.message || "Please try again later"
      });
      return "I encountered an error while analyzing the repository. Please try again.";
    }
  }
};
