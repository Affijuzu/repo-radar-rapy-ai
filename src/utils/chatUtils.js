
import { toast as showToast } from 'sonner';
import githubService from '@/services/github';
import pineconeService from '@/services/pinecone';

/**
 * Extract repository owner and name from a message
 */
export const extractRepoInfo = (message) => {
  // Look for patterns like "owner/repo" or "github.com/owner/repo"
  const repoPattern = /(?:github\.com\/)?([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/i;
  const match = message.match(repoPattern);
  
  if (match && match.length >= 3) {
    return {
      owner: match[1],
      repo: match[2]
    };
  }
  
  return null;
};

/**
 * Compare a new evaluation with previous ones
 */
export const compareWithPreviousEvaluations = (analysis, previousEvaluations) => {
  if (!previousEvaluations || previousEvaluations.length === 0) {
    return '';
  }
  
  const avgCommunity = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.communityScore, 0) / previousEvaluations.length;
  const avgDocs = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.docQualityScore, 0) / previousEvaluations.length;
  const avgActivity = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.activityScore, 0) / previousEvaluations.length;
  const avgOverall = previousEvaluations.reduce((sum, repoEval) => sum + repoEval.overallScore, 0) / previousEvaluations.length;
  
  const communityComparison = analysis.communityScore > avgCommunity ? 'higher' : 'lower';
  const docsComparison = analysis.docQualityScore > avgDocs ? 'higher' : 'lower';
  const activityComparison = analysis.activityScore > avgActivity ? 'higher' : 'lower';
  const overallComparison = analysis.overallScore > avgOverall ? 'higher' : 'lower';
  
  return `Compared to your previously analyzed repositories:
- Community support is ${communityComparison} than average (${avgCommunity.toFixed(1)})
- Documentation quality is ${docsComparison} than average (${avgDocs.toFixed(1)})
- Activity level is ${activityComparison} than average (${avgActivity.toFixed(1)})
- Overall score is ${overallComparison} than average (${avgOverall.toFixed(1)})`;
};

/**
 * Store repository evaluation in Pinecone
 */
export const storeRepoEvaluation = async (user, repoInfo, analysis) => {
  try {
    await pineconeService.addRepoEvaluation(user, {
      repoName: repoInfo.repo,
      owner: repoInfo.owner,
      evaluationDate: new Date(),
      stars: analysis.repoData.stars,
      forks: analysis.repoData.forks,
      issues: analysis.repoData.issues,
      contributors: analysis.repoData.contributors,
      commitFrequency: analysis.repoData.commitFrequency,
      communityScore: analysis.communityScore,
      docQualityScore: analysis.docQualityScore,
      activityScore: analysis.activityScore,
      overallScore: analysis.overallScore
    });
    
    showToast("Repository analyzed", {
      description: "Evaluation saved to memory",
    });
  } catch (e) {
    console.error("Error storing repo evaluation:", e);
    showToast("Warning", {
      description: "Couldn't save evaluation to memory",
    });
  }
};

/**
 * Format repository analysis as markdown
 */
export const formatRepoAnalysis = (repoInfo, analysis, userMemory) => {
  return `# Analysis of ${repoInfo.owner}/${repoInfo.repo}

## Repository Statistics
- **Stars:** ${analysis.repoData.stars.toLocaleString()}
- **Forks:** ${analysis.repoData.forks.toLocaleString()}
- **Open Issues:** ${analysis.repoData.issues.toLocaleString()}
- **Contributors:** ${analysis.repoData.contributors}
- **Last Updated:** ${analysis.repoData.lastUpdated.toLocaleDateString()}

## Evaluation Scores
- **Community Support:** ${analysis.communityScore.toFixed(1)}/100
- **Documentation Quality:** ${analysis.docQualityScore.toFixed(1)}/100
- **Activity Level:** ${analysis.activityScore.toFixed(1)}/100
- **Overall Score:** ${analysis.overallScore.toFixed(1)}/100

## Documentation
- README: ${analysis.repoData.hasReadme ? '✅ Present' : '❌ Missing'}
- Contributing Guidelines: ${analysis.repoData.hasContributing ? '✅ Present' : '❌ Missing'}
- Issue Templates: ${analysis.repoData.hasIssueTemplates ? '✅ Present' : '❌ Missing'}

## Analysis Summary
${analysis.overallScore > 80 ? 'This is an excellent repository with strong community support and documentation.' :
  analysis.overallScore > 60 ? 'This is a good repository with decent community support.' :
  analysis.overallScore > 40 ? 'This repository has some challenges but may still be useful depending on your needs.' :
  'This repository shows signs of low activity or limited documentation. Consider alternative options.'}

${userMemory?.repoEvaluations?.length > 0 ? 
  '\n## Comparison with Previously Evaluated Repos\n' + 
  compareWithPreviousEvaluations(analysis, userMemory.repoEvaluations) : ''}`;
};

/**
 * Format libraries search results as markdown
 */
export const formatLibrariesSearch = (repositories, userMemory) => {
  return `# React State Management Libraries

Based on my analysis, here are the top React state management libraries:

${repositories.map((repo, index) => `
## ${index + 1}. ${repo.name} (${repo.owner})
- **Stars:** ${repo.stars.toLocaleString()}
- **Forks:** ${repo.forks.toLocaleString()}
- **Open Issues:** ${repo.issues.toLocaleString()}
- **URL:** ${repo.url}
- **Description:** ${repo.description || 'No description available'}
`).join('\n')}

${userMemory?.userPreferences?.preferredLanguages?.includes('javascript') || 
  userMemory?.userPreferences?.frameworks?.includes('react') ?
  "\nBased on your preferences, I've prioritized React libraries that align with your interests." : ""}
`;
};

/**
 * Format previous evaluations as markdown
 */
export const formatPreviousEvaluations = (repoEvaluations) => {
  return `# Previously Analyzed Repositories

Based on your history, you've analyzed the following repositories:

${repoEvaluations.map((repoEval, index) => `
## ${index + 1}. ${repoEval.owner}/${repoEval.repoName}
- **Evaluated on:** ${new Date(repoEval.evaluationDate).toLocaleDateString()}
- **Stars:** ${repoEval.stars.toLocaleString()}
- **Overall Score:** ${repoEval.overallScore.toFixed(1)}/100
- **Community Score:** ${repoEval.communityScore.toFixed(1)}/100
- **Documentation Score:** ${repoEval.docQualityScore.toFixed(1)}/100
- **Activity Score:** ${repoEval.activityScore.toFixed(1)}/100
`).join('\n')}`;
};

/**
 * Default welcome message
 */
export const getDefaultResponse = () => {
  return "I'm Rapy, your GitHub repository analysis assistant! I can help you evaluate open-source projects based on metrics like stars, activity, community support, and documentation quality.\n\nTo analyze a repository, simply mention it in your message like 'facebook/react' or ask me about specific technologies like 'What are the most active React state management libraries?'";
};
