
import { extractRepoInfo, formatRepoAnalysis, formatLibrariesSearch, formatPreviousEvaluations, getDefaultResponse, storeRepoEvaluation } from '@/utils/chatUtils';
import githubService from './github';
import pineconeService from './pinecone';
import { toast as showToast } from 'sonner';
import { User } from '@/types/auth';

/**
 * Generate response based on user input
 */
export const generateResponse = async (content: string, user: User | null, userMemory: any): Promise<string> => {
  // Check if message contains a repository reference
  const repoInfo = extractRepoInfo(content);
  
  if (repoInfo) {
    // Check if GitHub API is configured
    if (!githubService.isConfigured()) {
      return "I need a valid GitHub API key to analyze repositories. Please go to Settings and configure your API keys first.";
    }
    
    // Analyze the repository
    try {
      showToast("Analyzing repository", {
        description: `Fetching data for ${repoInfo.owner}/${repoInfo.repo}...`,
      });
      
      const analysis = await githubService.analyzeRepo(repoInfo.owner, repoInfo.repo);
      
      if (analysis) {
        // Store this evaluation in Pinecone if user is logged in
        if (user && pineconeService.isConfigured()) {
          await storeRepoEvaluation(user, repoInfo, analysis);
        }
        
        // Format the analysis response
        return formatRepoAnalysis(repoInfo, analysis, userMemory);
      }
    } catch (e) {
      console.error("Failed to analyze repository", e);
      return "I encountered an error while analyzing this repository. Please try again or check if the repository exists and that your GitHub API key is valid.";
    }
  }
  
  // Check for specific requests
  if (content.toLowerCase().includes("react state") && 
      (content.toLowerCase().includes("library") || content.toLowerCase().includes("libraries"))) {
    
    try {
      // Search for React state management libraries
      const repositories = await githubService.searchRepos("react state management library");
      
      if (repositories && repositories.length > 0) {
        return formatLibrariesSearch(repositories, userMemory);
      }
    } catch (e) {
      console.error("Error searching repositories:", e);
    }
  }
  
  // If user has memory and asks about previous evaluations
  if (content.toLowerCase().includes("previous") && 
      (content.toLowerCase().includes("evaluation") || content.toLowerCase().includes("repository") || 
       content.toLowerCase().includes("repo") || content.toLowerCase().includes("analyzed"))) {
    
    if (userMemory && userMemory.repoEvaluations && userMemory.repoEvaluations.length > 0) {
      return formatPreviousEvaluations(userMemory.repoEvaluations);
    } else {
      return "I don't have any record of previously analyzed repositories. Let's analyze one now! Just mention a GitHub repository like 'owner/repo' in your message.";
    }
  }
  
  // Default response when no specific pattern is matched
  return getDefaultResponse();
};
