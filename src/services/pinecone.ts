
import { User } from '@/types/auth';
import { ChatHistoryItem, RepoAnalysis } from '@/types/chat';

export interface PineconeMemory {
  userId: string;
  repoEvaluations: RepoEvaluation[];
  userPreferences: UserPreferences;
}

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

export interface UserPreferences {
  preferredLanguages: string[];
  frameworks: string[];
  evaluationCriteria: {
    prioritizeDocs: boolean;
    prioritizeActivity: boolean;
    prioritizeCommunity: boolean;
  };
}

// Pinecone service with real API integration
export class PineconeService {
  private static instance: PineconeService;
  private apiKey?: string;
  private environment?: string;
  private indexName?: string;
  private projectId?: string;
  private namespace = 'anarepo-memories';
  
  static getInstance(): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService();
    }
    return PineconeService.instance;
  }
  
  configure(config: { apiKey: string; environment: string; indexName: string; projectId: string }) {
    this.apiKey = config.apiKey;
    this.environment = config.environment;
    this.indexName = config.indexName;
    this.projectId = config.projectId;
    console.log('Pinecone service configured');
  }
  
  isConfigured(): boolean {
    return !!(this.apiKey && this.environment && this.indexName && this.projectId);
  }
  
  private getBaseUrl(): string {
    return `https://${this.indexName}.svc.${this.environment}.pinecone.io`;
  }
  
  private getHeaders(): HeadersInit {
    return {
      'Api-Key': this.apiKey || '',
      'Content-Type': 'application/json',
    };
  }
  
  private async createEmbedding(text: string): Promise<number[]> {
    // This should be replaced with a call to an embedding model API like OpenAI or Gemini
    // For now, we'll use a simple mock embedding function
    return new Array(384).fill(0).map(() => Math.random() - 0.5);
  }
  
  async storeMemory(user: User, chatHistory: ChatHistoryItem[]): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Pinecone not configured. Using local storage only.');
      return;
    }
    
    try {
      console.log('Storing memory for user:', user.id);
      
      // Create a context from chat history
      const context = chatHistory.flatMap(chat => 
        chat.messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')
      ).join('\n\n');
      
      // Generate embedding using an embedding model
      const embedding = await this.createEmbedding(context);
      
      // Extract repo evaluations from chat history
      const repoEvaluations: RepoEvaluation[] = [];
      const userPreferences: UserPreferences = {
        preferredLanguages: [],
        frameworks: [],
        evaluationCriteria: {
          prioritizeDocs: false,
          prioritizeActivity: false,
          prioritizeCommunity: false,
        }
      };
      
      // Prepare the vector to upsert
      const vector = {
        id: `user-${user.id}`,
        values: embedding,
        metadata: {
          userId: user.id,
          repoEvaluations: JSON.stringify(repoEvaluations),
          userPreferences: JSON.stringify(userPreferences),
          context: context
        }
      };
      
      // Send upsert request to Pinecone
      const response = await fetch(`${this.getBaseUrl()}/vectors/upsert`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          vectors: [vector],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
      }
    } catch (error) {
      console.error('Error storing memory in Pinecone:', error);
    }
  }
  
  async retrieveMemory(user: User): Promise<PineconeMemory | null> {
    if (!this.isConfigured()) {
      console.log('Pinecone not configured. Using local storage only.');
      return null;
    }
    
    try {
      console.log('Retrieving memory for user:', user.id);
      
      // Query Pinecone for the user's vector
      const response = await fetch(`${this.getBaseUrl()}/vectors/fetch`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          ids: [`user-${user.id}`],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
        return null;
      }
      
      const data = await response.json();
      const vectors = data.vectors && data.vectors[`user-${user.id}`];
      
      if (!vectors || !vectors.metadata) {
        return null;
      }
      
      const repoEvaluations = JSON.parse(vectors.metadata.repoEvaluations || '[]');
      const userPreferences = JSON.parse(vectors.metadata.userPreferences || '{}');
      
      return {
        userId: user.id,
        repoEvaluations,
        userPreferences
      };
    } catch (error) {
      console.error('Error retrieving memory from Pinecone:', error);
      return null;
    }
  }
  
  async updateUserPreferences(user: User, preferences: Partial<UserPreferences>): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Pinecone not configured. Using local storage only.');
      return;
    }
    
    try {
      console.log('Updating preferences for user:', user.id);
      
      // First, retrieve current memory
      const memory = await this.retrieveMemory(user);
      if (!memory) {
        console.log('No existing memory found for user. Creating new memory.');
        const newMemory: PineconeMemory = {
          userId: user.id,
          repoEvaluations: [],
          userPreferences: {
            preferredLanguages: preferences.preferredLanguages || [],
            frameworks: preferences.frameworks || [],
            evaluationCriteria: preferences.evaluationCriteria || {
              prioritizeDocs: false,
              prioritizeActivity: false,
              prioritizeCommunity: false,
            }
          }
        };
        
        // Create a context for this new user
        const context = `User ${user.id} preferences: ${JSON.stringify(newMemory.userPreferences)}`;
        
        // Generate embedding
        const embedding = await this.createEmbedding(context);
        
        // Upsert the vector
        const vector = {
          id: `user-${user.id}`,
          values: embedding,
          metadata: {
            userId: user.id,
            repoEvaluations: JSON.stringify([]),
            userPreferences: JSON.stringify(newMemory.userPreferences),
            context: context
          }
        };
        
        const response = await fetch(`${this.getBaseUrl()}/vectors/upsert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            vectors: [vector],
            namespace: this.namespace
          })
        });
        
        if (!response.ok) {
          console.error('Pinecone API error:', await response.text());
        }
        
        return;
      }
      
      // Merge existing preferences with new preferences
      const updatedPreferences: UserPreferences = {
        preferredLanguages: preferences.preferredLanguages || memory.userPreferences.preferredLanguages,
        frameworks: preferences.frameworks || memory.userPreferences.frameworks,
        evaluationCriteria: {
          ...memory.userPreferences.evaluationCriteria,
          ...preferences.evaluationCriteria
        }
      };
      
      // Create updated context
      const context = `User ${user.id} preferences: ${JSON.stringify(updatedPreferences)}
      Repo evaluations: ${JSON.stringify(memory.repoEvaluations)}`;
      
      // Generate embedding
      const embedding = await this.createEmbedding(context);
      
      // Upsert the vector
      const vector = {
        id: `user-${user.id}`,
        values: embedding,
        metadata: {
          userId: user.id,
          repoEvaluations: JSON.stringify(memory.repoEvaluations),
          userPreferences: JSON.stringify(updatedPreferences),
          context: context
        }
      };
      
      const response = await fetch(`${this.getBaseUrl()}/vectors/upsert`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          vectors: [vector],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
      }
    } catch (error) {
      console.error('Error updating preferences in Pinecone:', error);
    }
  }
  
  async addRepoEvaluation(user: User, evaluation: RepoEvaluation): Promise<void> {
    if (!this.isConfigured()) {
      console.log('Pinecone not configured. Using local storage only.');
      return;
    }
    
    try {
      console.log('Adding repo evaluation for user:', user.id);
      
      // First, retrieve current memory
      const memory = await this.retrieveMemory(user);
      if (!memory) {
        console.log('No existing memory found for user. Creating new memory.');
        const newMemory: PineconeMemory = {
          userId: user.id,
          repoEvaluations: [evaluation],
          userPreferences: {
            preferredLanguages: [],
            frameworks: [],
            evaluationCriteria: {
              prioritizeDocs: false,
              prioritizeActivity: false,
              prioritizeCommunity: false,
            }
          }
        };
        
        // Create a context for this new evaluation
        const context = `Repo evaluation: ${evaluation.owner}/${evaluation.repoName} - Overall score: ${evaluation.overallScore}`;
        
        // Generate embedding
        const embedding = await this.createEmbedding(context);
        
        // Upsert the vector
        const vector = {
          id: `user-${user.id}`,
          values: embedding,
          metadata: {
            userId: user.id,
            repoEvaluations: JSON.stringify([evaluation]),
            userPreferences: JSON.stringify(newMemory.userPreferences),
            context: context
          }
        };
        
        const response = await fetch(`${this.getBaseUrl()}/vectors/upsert`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            vectors: [vector],
            namespace: this.namespace
          })
        });
        
        if (!response.ok) {
          console.error('Pinecone API error:', await response.text());
        }
        
        return;
      }
      
      // Check if this repo has been evaluated before
      const existingIndex = memory.repoEvaluations.findIndex(
        e => e.owner === evaluation.owner && e.repoName === evaluation.repoName
      );
      
      let updatedEvaluations: RepoEvaluation[];
      
      if (existingIndex >= 0) {
        // Update existing evaluation
        updatedEvaluations = [...memory.repoEvaluations];
        updatedEvaluations[existingIndex] = evaluation;
      } else {
        // Add new evaluation
        updatedEvaluations = [...memory.repoEvaluations, evaluation];
      }
      
      // Create updated context
      const context = updatedEvaluations
        .map(e => `Repo evaluation: ${e.owner}/${e.repoName} - Overall score: ${e.overallScore}`)
        .join('\n');
      
      // Generate embedding
      const embedding = await this.createEmbedding(context);
      
      // Upsert the vector
      const vector = {
        id: `user-${user.id}`,
        values: embedding,
        metadata: {
          userId: user.id,
          repoEvaluations: JSON.stringify(updatedEvaluations),
          userPreferences: JSON.stringify(memory.userPreferences),
          context: context
        }
      };
      
      const response = await fetch(`${this.getBaseUrl()}/vectors/upsert`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          vectors: [vector],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
      }
    } catch (error) {
      console.error('Error adding repo evaluation to Pinecone:', error);
    }
  }
}

export default PineconeService.getInstance();
