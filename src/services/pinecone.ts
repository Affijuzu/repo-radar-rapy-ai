
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
    evaluationCriteria?: {
      prioritizeDocs?: boolean;
      prioritizeActivity?: boolean;
      prioritizeCommunity?: boolean;
    };
  };
}

interface PineconeConfig {
  indexName: string;
  namespace: string;
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
      let userPreferences;
      
      if (settingsData?.notification_preferences) {
        const prefs = settingsData.notification_preferences as Record<string, any>;
        userPreferences = {
          preferredLanguages: prefs.preferred_languages || [],
          frameworks: prefs.frameworks || [],
          evaluationCriteria: {
            prioritizeDocs: prefs.prioritize_docs || false,
            prioritizeActivity: prefs.prioritize_activity || false, 
            prioritizeCommunity: prefs.prioritize_community || false
          }
        };
      }

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
  },
  
  updateUserPreferences: async (user: User, preferences: UserMemory["userPreferences"]): Promise<void> => {
    try {
      if (!preferences) return;
      
      // Check if user settings exist
      const { data, error: checkError } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (checkError) throw checkError;

      // Format preferences for storage
      const notificationPreferences = {
        preferred_languages: preferences.preferredLanguages || [],
        frameworks: preferences.frameworks || [],
        prioritize_docs: preferences.evaluationCriteria?.prioritizeDocs || false,
        prioritize_activity: preferences.evaluationCriteria?.prioritizeActivity || false,
        prioritize_community: preferences.evaluationCriteria?.prioritizeCommunity || false
      };
      
      // Insert or update user settings
      if (!data) {
        // Insert new settings
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            notification_preferences: notificationPreferences
          });
          
        if (error) throw error;
      } else {
        // Update existing settings
        const { error } = await supabase
          .from('user_settings')
          .update({
            notification_preferences: notificationPreferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
          
        if (error) throw error;
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      throw error;
    }
  },

  // Add these empty methods to make ApiKeysForm happy
  setApiKey: () => {},
  getRepoData: async () => { return {} as any; }
};

export default pineconeService;
