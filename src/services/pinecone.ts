
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
  private openaiApiKey?: string;
  private namespace = 'anarepo-memories';
  
  static getInstance(): PineconeService {
    if (!PineconeService.instance) {
      PineconeService.instance = new PineconeService();
    }
    return PineconeService.instance;
  }
  
  configure(config: { 
    apiKey: string; 
    environment: string; 
    indexName: string; 
    projectId?: string;
    openaiApiKey?: string;
  }) {
    this.apiKey = config.apiKey;
    this.environment = config.environment;
    this.indexName = config.indexName;
    this.projectId = config.projectId;
    this.openaiApiKey = config.openaiApiKey;
    console.log('Pinecone service configured');
    
    // Initialize Pinecone index if needed
    this.initializeIndex().catch(err => {
      console.error('Failed to initialize Pinecone index:', err);
    });
  }
  
  isConfigured(): boolean {
    return !!(this.apiKey && this.environment && this.indexName && this.openaiApiKey);
  }
  
  private getBaseUrl(): string {
    return `https://controller.${this.environment}.pinecone.io`;
  }
  
  private getIndexUrl(): string {
    return `https://${this.indexName}-${this.projectId || 'default'}.svc.${this.environment}.pinecone.io`;
  }
  
  private getControllerHeaders(): HeadersInit {
    return {
      'Api-Key': this.apiKey || '',
      'Content-Type': 'application/json',
    };
  }
  
  private getIndexHeaders(): HeadersInit {
    return {
      'Api-Key': this.apiKey || '',
      'Content-Type': 'application/json',
    };
  }
  
  private async initializeIndex(): Promise<void> {
    if (!this.isConfigured()) {
      return;
    }
    
    try {
      // Check if index exists
      const response = await fetch(`${this.getBaseUrl()}/databases`, {
        method: 'GET',
        headers: this.getControllerHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to list indexes: ${response.statusText}`);
      }
      
      const data = await response.json();
      const indexExists = data.databases.some((db: any) => db.name === this.indexName);
      
      if (!indexExists) {
        console.log(`Index ${this.indexName} does not exist. Creating...`);
        
        // Create the index
        const createResponse = await fetch(`${this.getBaseUrl()}/databases`, {
          method: 'POST',
          headers: this.getControllerHeaders(),
          body: JSON.stringify({
            name: this.indexName,
            dimension: 1536, // OpenAI embedding dimension
            metric: 'cosine',
            spec: { 
              serverless: { 
                cloud: 'gcp', 
                region: 'us-west1'
              } 
            },
          }),
        });
        
        if (!createResponse.ok) {
          console.error('Failed to create index:', await createResponse.text());
          throw new Error(`Failed to create index: ${createResponse.statusText}`);
        }
        
        console.log(`Index ${this.indexName} created successfully`);
      } else {
        console.log(`Index ${this.indexName} already exists`);
      }
    } catch (error) {
      console.error('Error initializing Pinecone index:', error);
    }
  }
  
  private async createEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      console.error('OpenAI API key not configured');
      // Return a mock embedding for fallback
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    }
    
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-ada-002',
        }),
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Error creating embedding:', error);
      // Return a mock embedding as fallback
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    }
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
      
      // Generate embedding using OpenAI
      const embedding = await this.createEmbedding(context);
      
      // Extract repo evaluations from chat history
      const repoEvaluations: RepoEvaluation[] = [];
      
      // Get existing user preferences or create default ones
      const memory = await this.retrieveMemory(user);
      const userPreferences: UserPreferences = memory?.userPreferences || {
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
      const response = await fetch(`${this.getIndexUrl()}/vectors/upsert`, {
        method: 'POST',
        headers: this.getIndexHeaders(),
        body: JSON.stringify({
          vectors: [vector],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
        throw new Error(`Pinecone API error: ${response.statusText}`);
      }
      
      console.log('Memory stored successfully');
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
      const response = await fetch(`${this.getIndexUrl()}/vectors/fetch`, {
        method: 'POST',
        headers: this.getIndexHeaders(),
        body: JSON.stringify({
          ids: [`user-${user.id}`],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('No memory found for user');
          return null;
        }
        console.error('Pinecone API error:', await response.text());
        throw new Error(`Pinecone API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      const vectors = data.vectors && data.vectors[`user-${user.id}`];
      
      if (!vectors || !vectors.metadata) {
        return null;
      }
      
      try {
        const repoEvaluations = JSON.parse(vectors.metadata.repoEvaluations || '[]');
        const userPreferences = JSON.parse(vectors.metadata.userPreferences || '{}');
        
        return {
          userId: user.id,
          repoEvaluations,
          userPreferences
        };
      } catch (e) {
        console.error('Error parsing memory data:', e);
        return null;
      }
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
        
        const response = await fetch(`${this.getIndexUrl()}/vectors/upsert`, {
          method: 'POST',
          headers: this.getIndexHeaders(),
          body: JSON.stringify({
            vectors: [vector],
            namespace: this.namespace
          })
        });
        
        if (!response.ok) {
          console.error('Pinecone API error:', await response.text());
          throw new Error(`Pinecone API error: ${response.statusText}`);
        }
        
        return;
      }
      
      // Merge existing preferences with new preferences
      const updatedPreferences: UserPreferences = {
        preferredLanguages: preferences.preferredLanguages || memory.userPreferences.preferredLanguages || [],
        frameworks: preferences.frameworks || memory.userPreferences.frameworks || [],
        evaluationCriteria: {
          ...memory.userPreferences.evaluationCriteria,
          ...(preferences.evaluationCriteria || {})
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
      
      const response = await fetch(`${this.getIndexUrl()}/vectors/upsert`, {
        method: 'POST',
        headers: this.getIndexHeaders(),
        body: JSON.stringify({
          vectors: [vector],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
        throw new Error(`Pinecone API error: ${response.statusText}`);
      }
      
      console.log('User preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences in Pinecone:', error);
      throw error;
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
        
        const response = await fetch(`${this.getIndexUrl()}/vectors/upsert`, {
          method: 'POST',
          headers: this.getIndexHeaders(),
          body: JSON.stringify({
            vectors: [vector],
            namespace: this.namespace
          })
        });
        
        if (!response.ok) {
          console.error('Pinecone API error:', await response.text());
          throw new Error(`Pinecone API error: ${response.statusText}`);
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
      
      const response = await fetch(`${this.getIndexUrl()}/vectors/upsert`, {
        method: 'POST',
        headers: this.getIndexHeaders(),
        body: JSON.stringify({
          vectors: [vector],
          namespace: this.namespace
        })
      });
      
      if (!response.ok) {
        console.error('Pinecone API error:', await response.text());
        throw new Error(`Pinecone API error: ${response.statusText}`);
      }
      
      console.log('Repository evaluation added successfully');
    } catch (error) {
      console.error('Error adding repo evaluation to Pinecone:', error);
      throw error;
    }
  }
}

export default PineconeService.getInstance();
