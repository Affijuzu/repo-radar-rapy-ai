
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface RepoAnalysis {
  name: string;
  owner: string;
  stars: number;
  forks: number;
  issues: number;
  contributors: number;
  commitFrequency: number;
  communityScore: number;
  docQualityScore: number;
  activityScore: number;
  overallScore: number;
  lastEvaluatedAt: Date;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  snippet: string;
  timestamp: Date;
  messages: Message[];
}

export interface Repository {
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  issues: number;
  url: string;
}
