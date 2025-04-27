
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// GitHub API token from environment variables
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") || "";

// Function to calculate scores
function calculateScores(repoData: any) {
  // Community score based on stars and forks
  const communityScore = Math.min(
    100,
    (Math.log(repoData.stars + 1) / Math.log(10000)) * 100 +
      (Math.log(repoData.forks + 1) / Math.log(1000)) * 40
  );

  // Documentation quality score
  let docQualityScore = 0;
  if (repoData.hasReadme) docQualityScore += 50;
  if (repoData.hasContributing) docQualityScore += 25;
  if (repoData.hasIssueTemplates) docQualityScore += 25;

  // Activity score based on commit frequency and issues
  const activityScore = Math.min(
    100,
    repoData.commitFrequency * 20 +
      (repoData.contributors > 20 ? 40 : repoData.contributors * 2)
  );

  // Overall score is a weighted average
  const overallScore = (communityScore * 0.4 + docQualityScore * 0.3 + activityScore * 0.3);

  return {
    communityScore,
    docQualityScore,
    activityScore,
    overallScore
  };
}

// Function to call GitHub API
async function fetchRepoData(owner: string, repo: string) {
  console.log(`Fetching data for ${owner}/${repo}`);
  
  try {
    // Create headers with authorization if token is available
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Rapy-Repository-Analyzer",
    };
    
    if (GITHUB_TOKEN) {
      headers["Authorization"] = `token ${GITHUB_TOKEN}`;
    }
    
    // Fetch main repository data
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    
    if (!repoResponse.ok) {
      if (repoResponse.status === 404) {
        throw new Error("Repository not found");
      }
      throw new Error(`GitHub API error: ${repoResponse.status}`);
    }
    
    const repoData = await repoResponse.json();
    
    if (!repoData) {
      throw new Error("No repository data returned");
    }
    
    // Fetch contributors
    const contributorsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`, { headers });
    const contributorsData = await contributorsResponse.json();
    let contributors = 0;
    
    if (contributorsResponse.ok && Array.isArray(contributorsData)) {
      // Get total from the Link header if available
      const linkHeader = contributorsResponse.headers.get("Link");
      if (linkHeader) {
        const match = linkHeader.match(/page=(\d+)>; rel="last"/);
        if (match && match[1]) {
          contributors = parseInt(match[1], 10);
        } else {
          contributors = contributorsData.length;
        }
      } else {
        contributors = contributorsData.length;
      }
    }
    
    // Fetch commits to calculate frequency
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`, { headers });
    let commitFrequency = 0;
    
    if (commitsResponse.ok) {
      const commitsData = await commitsResponse.json();
      
      if (Array.isArray(commitsData) && commitsData.length > 1) {
        // Calculate average commits per day based on available data
        const firstCommitDate = new Date(commitsData[commitsData.length - 1].commit.author.date);
        const lastCommitDate = new Date(commitsData[0].commit.author.date);
        const daysDiff = Math.max(1, (lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24));
        commitFrequency = commitsData.length / daysDiff;
      }
    }
    
    // Check for README, CONTRIBUTING, and issue templates
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, { headers });
    const contentsData = await contentsResponse.json();
    
    let hasReadme = false;
    let hasContributing = false;
    
    if (contentsResponse.ok && Array.isArray(contentsData)) {
      hasReadme = contentsData.some(file => 
        file.name.toLowerCase() === 'readme.md' || file.name.toLowerCase() === 'readme'
      );
      
      hasContributing = contentsData.some(file => 
        file.name.toLowerCase() === 'contributing.md' || file.name.toLowerCase() === 'contributing'
      );
    }
    
    // Check for issue templates
    const templatesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/.github/ISSUE_TEMPLATE`, { headers });
    const hasIssueTemplates = templatesResponse.ok;
    
    // Build the repository data object
    return {
      stars: repoData.stargazers_count || 0,
      forks: repoData.forks_count || 0,
      issues: repoData.open_issues_count || 0,
      contributors: contributors || 0,
      lastUpdated: new Date(repoData.updated_at || Date.now()),
      commitFrequency: commitFrequency || 0.1,
      hasReadme: hasReadme,
      hasContributing: hasContributing,
      hasIssueTemplates: hasIssueTemplates
    };
  } catch (error) {
    console.error("Error fetching repo data:", error);
    throw error;
  }
}

// Real GitHub search API
async function searchRepositories(query: string) {
  console.log(`Searching for repositories with query: ${query}`);
  
  try {
    // Create headers with authorization if token is available
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Rapy-Repository-Analyzer"
    };
    
    if (GITHUB_TOKEN) {
      headers["Authorization"] = `token ${GITHUB_TOKEN}`;
    }
    
    // Call the GitHub search API
    const response = await fetch(
      `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`, 
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data || !Array.isArray(data.items)) {
      throw new Error("Invalid response from GitHub API");
    }
    
    // Map the results to our format
    const repositories = data.items.map((item: any) => ({
      name: item.name,
      owner: item.owner.login,
      stars: item.stargazers_count,
      forks: item.forks_count,
      issues: item.open_issues_count,
      url: item.html_url,
      description: item.description || "No description available"
    }));
    
    console.log(`Found ${repositories.length} repositories`);
    return repositories;
  } catch (error) {
    console.error("Error searching repositories:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("analyze-repo: Received request");
  
  try {
    const { owner, repo, searchQuery } = await req.json();
    
    console.log("Request parameters:", { owner, repo, searchQuery });
    
    if (searchQuery) {
      // Handle repository search
      console.log(`Searching for: ${searchQuery}`);
      const searchResults = await searchRepositories(searchQuery);
      
      console.log(`Returning ${searchResults.length} search results`);
      return new Response(
        JSON.stringify({ searchResults }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    if (!owner || !repo) {
      throw new Error("Missing required parameters: owner and repo");
    }

    // Fetch repository data
    console.log(`Analyzing repo: ${owner}/${repo}`);
    const repoData = await fetchRepoData(owner, repo);
    
    // Calculate scores
    const scores = calculateScores(repoData);
    
    // Combine data and scores
    const result = {
      repoData,
      ...scores
    };

    console.log("Analysis complete:", JSON.stringify(result));
    
    // Return the analysis
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "An unknown error occurred",
        errorType: error.message === "Repository not found" ? "NOT_FOUND" : "API_ERROR"
      }),
      {
        status: error.message === "Repository not found" ? 404 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
