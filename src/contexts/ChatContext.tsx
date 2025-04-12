
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ChatHistoryItem, RepoAnalysis } from '@/types/chat';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { toast as showToast } from 'sonner';
import pineconeService, { RepoEvaluation } from '@/services/pinecone';
import githubService from '@/services/github';

interface ChatContextType {
  messages: Message[];
  chatHistory: ChatHistoryItem[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  loadChatHistory: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [userMemory, setUserMemory] = useState<any>(null);

  useEffect(() => {
    if (user) {
      // Load chat history from localStorage
      const savedHistoryString = localStorage.getItem(`anarepo_chat_history_${user.id}`);
      if (savedHistoryString) {
        try {
          const savedHistory: ChatHistoryItem[] = JSON.parse(savedHistoryString);
          // Convert string dates back to Date objects
          const fixedHistory = savedHistory.map(item => ({
            ...item,
            timestamp: new Date(item.timestamp),
            messages: item.messages.map(msg => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }));
          setChatHistory(fixedHistory);
        } catch (e) {
          console.error("Failed to parse chat history", e);
          setChatHistory([]);
        }
      }

      // Load memory from Pinecone
      const loadMemory = async () => {
        try {
          if (pineconeService.isConfigured()) {
            const memory = await pineconeService.retrieveMemory(user);
            if (memory) {
              console.log("Loaded memory from Pinecone:", memory);
              setUserMemory(memory);
              
              // Show a toast notification if we have previous evaluations
              if (memory.repoEvaluations && memory.repoEvaluations.length > 0) {
                showToast("Memory loaded", {
                  description: `Found ${memory.repoEvaluations.length} previous repository evaluations`,
                });
              }
            }
          }
        } catch (e) {
          console.error("Failed to load memory from Pinecone", e);
        }
      };
      
      loadMemory();
    } else {
      setChatHistory([]);
      setUserMemory(null);
    }
  }, [user]);

  // Helper function to extract repository info from message
  const extractRepoInfo = (message: string): { owner: string, repo: string } | null => {
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

  // Function to generate response based on message content
  const generateResponse = async (content: string): Promise<string> => {
    // Check if message contains a repository reference
    const repoInfo = extractRepoInfo(content);
    
    if (repoInfo) {
      // Check if GitHub API is configured
      if (!githubService.isConfigured) {
        return "I need a valid GitHub API key to analyze repositories. Please go to Settings and configure your API keys first.";
      }
      
      // Analyze the repository
      try {
        showToast("Analyzing repository", {
          description: `Fetching data for ${repoInfo.owner}/${repoInfo.repo}...`,
        });
        
        const analysis = await githubService.analyzeRepo(repoInfo.owner, repoInfo.repo);
        
        if (analysis) {
          // Store this evaluation in Pinecone
          if (user && pineconeService.isConfigured()) {
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
          }
          
          // Format the analysis response
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
        }
      } catch (e) {
        console.error("Failed to analyze repository", e);
        return "I encountered an error while analyzing this repository. Please try again or check if the repository exists and that your GitHub API key is valid.";
      }
    }
    
    // Check for specific requests
    if (content.toLowerCase().includes("react state") && 
        (content.toLowerCase().includes("library") || content.toLowerCase().includes("libraries"))) {
      
      try {
        // Search for React state management libraries
        const repositories = await githubService.searchRepos("react state management library");
        
        if (repositories && repositories.length > 0) {
          // Format the response
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
        }
      } catch (e) {
        console.error("Error searching repositories:", e);
      }
    }
    
    // If user has memory and asks about previous evaluations
    if (content.toLowerCase().includes("previous") && 
        (content.toLowerCase().includes("evaluation") || content.toLowerCase().includes("repository") || 
         content.toLowerCase().includes("repo") || content.toLowerCase().includes("analyzed"))) {
      
      if (userMemory && userMemory.repoEvaluations && userMemory.repoEvaluations.length > 0) {
        return `# Previously Analyzed Repositories

Based on your history, you've analyzed the following repositories:

${userMemory.repoEvaluations.map((repoEval: RepoEvaluation, index: number) => `
## ${index + 1}. ${repoEval.owner}/${repoEval.repoName}
- **Evaluated on:** ${new Date(repoEval.evaluationDate).toLocaleDateString()}
- **Stars:** ${repoEval.stars.toLocaleString()}
- **Overall Score:** ${repoEval.overallScore.toFixed(1)}/100
- **Community Score:** ${repoEval.communityScore.toFixed(1)}/100
- **Documentation Score:** ${repoEval.docQualityScore.toFixed(1)}/100
- **Activity Score:** ${repoEval.activityScore.toFixed(1)}/100
`).join('\n')}`;
      } else {
        return "I don't have any record of previously analyzed repositories. Let's analyze one now! Just mention a GitHub repository like 'owner/repo' in your message.";
      }
    }
    
    // Default response when no specific pattern is matched
    return "I'm Rapy, your GitHub repository analysis assistant! I can help you evaluate open-source projects based on metrics like stars, activity, community support, and documentation quality.\n\nTo analyze a repository, simply mention it in your message like 'facebook/react' or ask me about specific technologies like 'What are the most active React state management libraries?'";
  };
  
  // Helper function to compare a new evaluation with previous ones
  const compareWithPreviousEvaluations = (analysis: any, previousEvaluations: RepoEvaluation[]): string => {
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

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    const newUserMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Generate response using our helper function
      const responseContent = await generateResponse(content);
      
      const newAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newAssistantMessage]);
      
      // If this is a new conversation, save it to history
      if (user && messages.length <= 1) {
        const newChatHistory: ChatHistoryItem = {
          id: uuidv4(),
          title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
          snippet: content,
          timestamp: new Date(),
          messages: [newUserMessage, newAssistantMessage]
        };
        
        const updatedHistory = [newChatHistory, ...chatHistory];
        setChatHistory(updatedHistory);
        
        // Save to localStorage
        localStorage.setItem(
          `anarepo_chat_history_${user.id}`, 
          JSON.stringify(updatedHistory)
        );

        // Store in Pinecone if configured
        if (pineconeService.isConfigured()) {
          try {
            await pineconeService.storeMemory(user, updatedHistory);
          } catch (e) {
            console.error("Error storing memory in Pinecone:", e);
          }
        }
      } else if (user) {
        // Update existing conversation
        const updatedMessages = [...messages, newUserMessage, newAssistantMessage];
        const updatedHistory = chatHistory.map((item, index) => {
          if (index === 0) {
            return {
              ...item,
              messages: updatedMessages
            };
          }
          return item;
        });
        
        setChatHistory(updatedHistory);
        localStorage.setItem(
          `anarepo_chat_history_${user.id}`, 
          JSON.stringify(updatedHistory)
        );

        // Update in Pinecone if configured
        if (pineconeService.isConfigured()) {
          try {
            await pineconeService.storeMemory(user, updatedHistory);
          } catch (e) {
            console.error("Error updating memory in Pinecone:", e);
          }
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get a response from Rapy AI.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (messages.length > 0) {
      setMessages([]);
    }
  };

  const loadChatHistory = (chatId: string) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
    }
  };

  return (
    <ChatContext.Provider value={{
      messages,
      chatHistory,
      isLoading,
      sendMessage,
      clearChat,
      loadChatHistory
    }}>
      {children}
    </ChatContext.Provider>
  );
};
