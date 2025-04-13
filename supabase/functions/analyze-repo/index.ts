
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Mock GitHub API for demo (in a real app, we'd call the actual GitHub API)
async function fetchRepoData(owner: string, repo: string) {
  // This is a mock implementation
  // In production, you would use the GitHub API:
  // const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  
  // Generate realistic but random data
  const now = new Date();
  const repoData = {
    stars: Math.floor(Math.random() * 50000) + 100,
    forks: Math.floor(Math.random() * 5000) + 10,
    issues: Math.floor(Math.random() * 500) + 5,
    contributors: Math.floor(Math.random() * 100) + 2,
    lastUpdated: new Date(now.setDate(now.getDate() - Math.floor(Math.random() * 60))),
    commitFrequency: Math.random() * 10 + 0.2, // commits per day
    hasReadme: Math.random() > 0.1, // 90% have README
    hasContributing: Math.random() > 0.5, // 50% have CONTRIBUTING
    hasIssueTemplates: Math.random() > 0.4, // 60% have issue templates
  };
  
  return repoData;
}

// Mock GitHub search API
async function searchRepositories(query: string) {
  // This would normally call the GitHub search API
  // const response = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`);
  
  const repositories = [];
  const count = 5; // Return 5 repositories
  
  for (let i = 0; i < count; i++) {
    const repoNames = [
      "redux", "recoil", "mobx", "zustand", "jotai", "valtio", "xstate"
    ];
    const owners = [
      "facebook", "pmndrs", "mobxjs", "reduxjs", "statelyai"
    ];
    
    repositories.push({
      name: repoNames[i % repoNames.length],
      owner: owners[i % owners.length],
      stars: Math.floor(Math.random() * 50000) + 1000,
      forks: Math.floor(Math.random() * 5000) + 100,
      issues: Math.floor(Math.random() * 300) + 10,
      url: `https://github.com/${owners[i % owners.length]}/${repoNames[i % repoNames.length]}`,
      description: `A state management library for ${query.includes("react") ? "React" : "JavaScript"} applications`
    });
  }
  
  // Sort by stars
  return repositories.sort((a, b) => b.stars - a.stars);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { owner, repo, searchQuery } = await req.json();
    
    if (searchQuery) {
      // Handle repository search
      const searchResults = await searchRepositories(searchQuery);
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
    const repoData = await fetchRepoData(owner, repo);
    
    // Calculate scores
    const scores = calculateScores(repoData);
    
    // Combine data and scores
    const result = {
      repoData,
      ...scores
    };

    // Return the analysis
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
