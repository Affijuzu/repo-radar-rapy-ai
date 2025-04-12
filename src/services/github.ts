import { Repository } from '@/types/chat';

// Real GitHub API integration
export interface RepoData {
  name: string;
  owner: string;
  description: string;
  stars: number;
  forks: number;
  issues: number;
  contributors: number;
  commitFrequency: number;
  hasReadme: boolean;
  hasContributing: boolean;
  hasIssueTemplates: boolean;
  lastUpdated: Date;
}

export interface RepoAnalysis {
  repoData: RepoData;
  communityScore: number;
  docQualityScore: number;
  activityScore: number;
  overallScore: number;
}

// GitHub service implementation with actual API calls
export class GitHubService {
  private static instance: GitHubService;
  private apiKey?: string;
  private baseUrl = 'https://api.github.com';
  
  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }
  
  setApiKey(key: string): void {
    this.apiKey = key;
  }
  
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  private getHeaders() {
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `token ${this.apiKey}`;
    }
    
    return headers;
  }
  
  async getRepoData(owner: string, repo: string): Promise<RepoData | null> {
    try {
      console.log(`Fetching data for ${owner}/${repo}`);
      
      // Fetch basic repo data
      const repoResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
        headers: this.getHeaders()
      });
      
      if (!repoResponse.ok) {
        throw new Error(`GitHub API error: ${repoResponse.status}`);
      }
      
      const repoData = await repoResponse.json();
      
      // Fetch contributors
      const contributorsResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contributors?per_page=1&anon=true`, {
        headers: this.getHeaders()
      });
      
      let contributorCount = 0;
      if (contributorsResponse.ok) {
        // Get total count from link header if available
        const linkHeader = contributorsResponse.headers.get('Link');
        if (linkHeader && linkHeader.includes('rel="last"')) {
          const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
          if (match) {
            contributorCount = parseInt(match[1], 10);
          }
        } else {
          // If no link header, count the contributors in the response
          const contributors = await contributorsResponse.json();
          contributorCount = Array.isArray(contributors) ? contributors.length : 0;
        }
      }
      
      // Fetch commits to calculate frequency
      const commitsResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=100`, {
        headers: this.getHeaders()
      });
      
      let commitFrequency = 0;
      if (commitsResponse.ok) {
        const commits = await commitsResponse.json();
        if (Array.isArray(commits) && commits.length > 1) {
          // Calculate average frequency based on last 100 commits
          const latestCommitDate = new Date(commits[0].commit.author.date);
          const oldestCommitDate = new Date(commits[commits.length - 1].commit.author.date);
          const daysDiff = (latestCommitDate.getTime() - oldestCommitDate.getTime()) / (1000 * 3600 * 24);
          commitFrequency = daysDiff > 0 ? commits.length / daysDiff : 0;
        }
      }
      
      // Check for documentation
      const readmeResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/readme`, {
        headers: this.getHeaders()
      });
      const hasReadme = readmeResponse.ok;
      
      const contributingResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/CONTRIBUTING.md`, {
        headers: this.getHeaders()
      });
      const hasContributing = contributingResponse.ok;
      
      const issueTemplatesResponse = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/contents/.github/ISSUE_TEMPLATE`, {
        headers: this.getHeaders()
      });
      const hasIssueTemplates = issueTemplatesResponse.ok;
      
      return {
        name: repoData.name,
        owner: repoData.owner.login,
        description: repoData.description || '',
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        issues: repoData.open_issues_count,
        contributors: contributorCount,
        commitFrequency,
        hasReadme,
        hasContributing,
        hasIssueTemplates,
        lastUpdated: new Date(repoData.updated_at)
      };
    } catch (error) {
      console.error('Error fetching repo data:', error);
      return null;
    }
  }
  
  async analyzeRepo(owner: string, repo: string): Promise<RepoAnalysis | null> {
    const repoData = await this.getRepoData(owner, repo);
    if (!repoData) return null;
    
    // Calculate scores based on the repo data
    const communityScore = this.calculateCommunityScore(repoData);
    const docQualityScore = this.calculateDocQualityScore(repoData);
    const activityScore = this.calculateActivityScore(repoData);
    
    const overallScore = (communityScore + docQualityScore + activityScore) / 3;
    
    return {
      repoData,
      communityScore,
      docQualityScore,
      activityScore,
      overallScore
    };
  }
  
  async searchRepos(query: string): Promise<Repository[]> {
    try {
      console.log(`Searching repositories with query: ${query}`);
      
      const response = await fetch(
        `${this.baseUrl}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`, 
        { headers: this.getHeaders() }
      );
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.items.map((item: any) => ({
        owner: item.owner.login,
        name: item.name,
        description: item.description || '',
        stars: item.stargazers_count,
        forks: item.forks_count,
        issues: item.open_issues_count,
        url: item.html_url
      }));
    } catch (error) {
      console.error('Error searching repositories:', error);
      return [];
    }
  }
  
  private calculateCommunityScore(repo: RepoData): number {
    // Score from 0-100 based on contributors, issues, forks
    const contributorScore = Math.min(repo.contributors * 2, 40);
    const issueScore = Math.min(repo.issues / 10, 30);
    const forkScore = Math.min(repo.forks / 100, 30);
    
    return Math.min(contributorScore + issueScore + forkScore, 100);
  }
  
  private calculateDocQualityScore(repo: RepoData): number {
    // Score from 0-100 based on documentation
    let score = 0;
    if (repo.hasReadme) score += 40;
    if (repo.hasContributing) score += 30;
    if (repo.hasIssueTemplates) score += 30;
    
    return score;
  }
  
  private calculateActivityScore(repo: RepoData): number {
    // Score from 0-100 based on commit frequency and last updated
    const commitScore = Math.min(repo.commitFrequency * 10, 70);
    
    // Calculate recency score (max 30 points)
    const daysSinceUpdate = (new Date().getTime() - repo.lastUpdated.getTime()) / (1000 * 3600 * 24);
    const recencyScore = daysSinceUpdate < 7 ? 30 :
                        daysSinceUpdate < 30 ? 20 :
                        daysSinceUpdate < 90 ? 10 : 0;
    
    return Math.min(commitScore + recencyScore, 100);
  }
}

export default GitHubService.getInstance();
