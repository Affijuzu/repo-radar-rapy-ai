
import { supabase } from "@/integrations/supabase/client";
import { Repository } from "@/types/chat";
import { toast } from "sonner";

interface RepoData {
  stars: number;
  forks: number;
  issues: number;
  contributors: number;
  lastUpdated: Date;
  commitFrequency: number;
  hasReadme: boolean;
  hasContributing: boolean;
  hasIssueTemplates: boolean;
}

interface RepoAnalysis {
  repoData: RepoData;
  communityScore: number;
  docQualityScore: number;
  activityScore: number;
  overallScore: number;
}

const githubService = {
  isConfigured: (): boolean => {
    return true; // We're using the edge function now which has its own token
  },

  analyzeRepo: async (owner: string, repo: string): Promise<RepoAnalysis> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-repo', {
        body: { owner, repo }
      });

      if (error) throw error;
      
      if (!data) throw new Error("No data returned from the server");
      
      // Store the analysis in the database
      const { error: dbError } = await supabase.from('repo_analyses').insert({
        repo_name: repo,
        owner: owner,
        stars: data.repoData.stars,
        forks: data.repoData.forks,
        issues: data.repoData.issues,
        contributors: data.repoData.contributors,
        commit_frequency: data.repoData.commitFrequency,
        community_score: data.communityScore,
        doc_quality_score: data.docQualityScore,
        activity_score: data.activityScore,
        overall_score: data.overallScore
      });

      if (dbError) {
        console.error("Error storing repo analysis:", dbError);
      }

      return data;
    } catch (error: any) {
      console.error("Error analyzing repository:", error);
      toast.error("Failed to analyze repository", {
        description: error.message || "Please try again later"
      });
      throw error;
    }
  },

  searchRepos: async (query: string): Promise<Repository[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-repo', {
        body: { searchQuery: query }
      });

      if (error) throw error;
      
      if (!data || !data.searchResults) throw new Error("No search results returned");
      
      return data.searchResults;
    } catch (error: any) {
      console.error("Error searching repositories:", error);
      toast.error("Failed to search repositories", {
        description: error.message || "Please try again later"
      });
      throw error;
    }
  }
};

export default githubService;
