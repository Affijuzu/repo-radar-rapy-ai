
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ChatHistoryItem, RepoAnalysis } from '@/types/chat';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';
import pineconeService from '@/services/pinecone';
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

      // In a full implementation, we would also load memory from Pinecone here
      const loadMemory = async () => {
        try {
          const memory = await pineconeService.retrieveMemory(user);
          console.log("Loaded memory from Pinecone:", memory);
          // Use the memory to enhance the chat experience
        } catch (e) {
          console.error("Failed to load memory from Pinecone", e);
        }
      };
      
      // Commenting out for now as this is a mock implementation
      // loadMemory();
    } else {
      setChatHistory([]);
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
      // Analyze the repository
      try {
        const analysis = await githubService.analyzeRepo(repoInfo.owner, repoInfo.repo);
        
        if (analysis) {
          // Store this evaluation in memory (would be Pinecone in a real app)
          if (user) {
            pineconeService.addRepoEvaluation(user, {
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
          }
          
          // Format the analysis response
          return `Based on my analysis of ${repoInfo.owner}/${repoInfo.repo}:

Stars: ${analysis.repoData.stars.toLocaleString()}
Forks: ${analysis.repoData.forks.toLocaleString()}
Open Issues: ${analysis.repoData.issues.toLocaleString()}
Contributors: ${analysis.repoData.contributors}

Community Score: ${analysis.communityScore.toFixed(1)}/100
Documentation Quality: ${analysis.docQualityScore.toFixed(1)}/100
Activity Score: ${analysis.activityScore.toFixed(1)}/100
Overall Score: ${analysis.overallScore.toFixed(1)}/100

${analysis.overallScore > 80 ? 'This is an excellent repository with strong community support and documentation.' :
  analysis.overallScore > 60 ? 'This is a good repository with decent community support.' :
  analysis.overallScore > 40 ? 'This repository has some challenges but may still be useful depending on your needs.' :
  'This repository shows signs of low activity or limited documentation. Consider alternative options.'}`;
        }
      } catch (e) {
        console.error("Failed to analyze repository", e);
        return "I encountered an error while analyzing this repository. Please try again or check if the repository exists.";
      }
    }
    
    // For other types of messages, use canned responses
    const responses = [
      "Based on my analysis, this repository has excellent documentation and strong community support. The commit frequency is high, indicating active maintenance.",
      "Looking at the repository trends, I notice this project has gained significant traction in the past months. Stars have increased by 28% and the number of contributors has doubled.",
      "Comparing this with repositories we've analyzed before, this one scores lower on documentation quality but higher on community engagement. The issue response time is particularly impressive.",
      "This React state management library shows promising activity levels. With 12k stars and an average of 32 commits per week, it ranks in the top 5% of active React libraries.",
      "I've analyzed the Python library as requested. It has good test coverage (87%) but the documentation could use improvement. The maintainers are very responsive to issues, typically responding within 24 hours.",
      "Based on your preferred evaluation criteria from our previous discussions, this repository scores 8.7/10. It meets most of your requirements for activity and maintenance."
    ];
    
    // If the message is asking about React state management libraries
    if (content.toLowerCase().includes("react") && content.toLowerCase().includes("state") && 
        (content.toLowerCase().includes("library") || content.toLowerCase().includes("libraries"))) {
      return "Based on my analysis of React state management libraries, here are the top choices:\n\n" +
        "1. Redux (45k+ stars): The most established option with extensive ecosystem\n" +
        "2. Zustand (33k+ stars): Simple, hook-based state management with minimal boilerplate\n" +
        "3. Jotai (12k+ stars): Atomic approach to state management with React Suspense support\n" +
        "4. Recoil (18k+ stars): Facebook's experimental library for state management\n" +
        "5. MobX (25k+ stars): Reactive state management using observable patterns\n\n" +
        "Zustand has shown the highest growth rate recently, with many developers migrating from Redux due to its simplicity.";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
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

        // In a full implementation, we would also store this in Pinecone
        pineconeService.storeMemory(user, updatedHistory);
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

        // In a full implementation, we would also update this in Pinecone
        pineconeService.storeMemory(user, updatedHistory);
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
