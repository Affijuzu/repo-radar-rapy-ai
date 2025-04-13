
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types/auth";

export interface RepoEvaluation {
  repoName: string;
  owner: string;
  evaluationDate: Date;
  stars: number;
  forks: number;
  issues: number;
  contributors: number;
  commitFrequency: number;
  communityScore: number;
  docQualityScore: number;
  activityScore: number;
  overallScore: number;
}

interface UserMemory {
  repoEvaluations: RepoEvaluation[];
  userPreferences?: {
    preferredLanguages?: string[];
    frameworks?: string[];
  };
}

const pineconeService = {
  isConfigured: (): boolean => {
    return true; // We're using Supabase now, so no separate Pinecone API key needed
  },

  retrieveMemory: async (user: User): Promise<UserMemory | null> => {
    try {
      // Get user's previous repo evaluations
      const { data: repoData, error: repoError } = await supabase
        .from('repo_analyses')
        .select('*')
        .eq('user_id', user.id);

      if (repoError) throw repoError;

      // Get user preferences if any
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError) throw settingsError;

      // Format repo evaluations
      const repoEvaluations = repoData.map((repo): RepoEvaluation => ({
        repoName: repo.repo_name,
        owner: repo.owner,
        evaluationDate: new Date(repo.evaluated_at),
        stars: repo.stars,
        forks: repo.forks,
        issues: repo.issues,
        contributors: repo.contributors,
        commitFrequency: repo.commit_frequency,
        communityScore: repo.community_score,
        docQualityScore: repo.doc_quality_score,
        activityScore: repo.activity_score,
        overallScore: repo.overall_score
      }));

      // Format user preferences if available
      const userPreferences = settingsData?.notification_preferences 
        ? {
            preferredLanguages: settingsData.notification_preferences.preferred_languages || [],
            frameworks: settingsData.notification_preferences.frameworks || []
          }
        : undefined;

      return {
        repoEvaluations,
        userPreferences
      };
    } catch (error) {
      console.error("Error retrieving memory from Supabase:", error);
      return null;
    }
  },

  storeMemory: async (user: User, chatHistory: any): Promise<void> => {
    // We don't need this as we're storing directly in the database
    return;
  },

  addRepoEvaluation: async (user: User, evaluation: RepoEvaluation): Promise<void> => {
    try {
      const { error } = await supabase
        .from('repo_analyses')
        .insert({
          user_id: user.id,
          repo_name: evaluation.repoName,
          owner: evaluation.owner,
          stars: evaluation.stars,
          forks: evaluation.forks,
          issues: evaluation.issues,
          contributors: evaluation.contributors,
          commit_frequency: evaluation.commitFrequency,
          community_score: evaluation.communityScore,
          doc_quality_score: evaluation.docQualityScore,
          activity_score: evaluation.activityScore,
          overall_score: evaluation.overallScore,
          evaluated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error storing repo evaluation in Supabase:", error);
    }
  }
};

export default pineconeService;
