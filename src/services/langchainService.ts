
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';
import { toast } from 'sonner';

export const langchainService = {
  analyzeRepositoryWithLangChain: async (content: string, user: User | null): Promise<string> => {
    try {
      console.log("Analyzing repository with LangChain:", content);
      
      // Call the analyze-repo edge function first to get repository data
      const { data: repoData, error: repoError } = await supabase.functions.invoke('analyze-repo', {
        body: { content }
      });

      if (repoError || !repoData) {
        console.error("Error fetching repository data:", repoError);
        return "I encountered an error while analyzing the repository. Please try again.";
      }

      // Initialize ChatOpenAI with the API key from edge function
      const chat = new ChatOpenAI({
        modelName: "gpt-4o-mini", // Using the more cost-effective model
        temperature: 0.7,
      });

      // Create a template for analyzing repository data
      const template = ChatPromptTemplate.fromTemplate(`
      Analyze this GitHub repository data and provide insights:
      Stars: {stars}
      Forks: {forks}
      Issues: {issues}
      Contributors: {contributors}
      Last Updated: {lastUpdated}
      Commit Frequency: {commitFrequency}
      Has README: {hasReadme}
      Has Contributing Guide: {hasContributing}
      Has Issue Templates: {hasIssueTemplates}

      Please provide a detailed analysis of:
      1. Community health and engagement
      2. Documentation quality
      3. Project activity and maintenance
      4. Overall recommendation
      `);

      // Format the prompt with repository data
      const formattedPrompt = await template.format({
        stars: repoData.repoData.stars,
        forks: repoData.repoData.forks,
        issues: repoData.repoData.issues,
        contributors: repoData.repoData.contributors,
        lastUpdated: repoData.repoData.lastUpdated,
        commitFrequency: repoData.repoData.commitFrequency,
        hasReadme: repoData.repoData.hasReadme,
        hasContributing: repoData.repoData.hasContributing,
        hasIssueTemplates: repoData.repoData.hasIssueTemplates
      });

      // Get the analysis from LangChain
      const response = await chat.invoke(formattedPrompt);

      console.log("LangChain analysis completed");
      return response.text || response.content || "Analysis completed but no response content available.";

    } catch (e: any) {
      console.error("Failed to analyze with LangChain:", e);
      toast.error("Analysis failed", {
        description: e.message || "Please try again later"
      });
      return "I encountered an error while analyzing the repository with LangChain. Please try again.";
    }
  }
};
