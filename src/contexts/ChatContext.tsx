
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Message, ChatHistoryItem } from '@/types/chat';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/components/ui/use-toast';

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
    } else {
      setChatHistory([]);
    }
  }, [user]);

  // Sample responses from Rapy AI
  const rapyResponses = [
    "Based on my analysis, this repository has excellent documentation and strong community support. The commit frequency is high, indicating active maintenance.",
    "Looking at the repository trends, I notice this project has gained significant traction in the past months. Stars have increased by 28% and the number of contributors has doubled.",
    "Comparing this with repositories we've analyzed before, this one scores lower on documentation quality but higher on community engagement. The issue response time is particularly impressive.",
    "This React state management library shows promising activity levels. With 12k stars and an average of 32 commits per week, it ranks in the top 5% of active React libraries.",
    "I've analyzed the Python library as requested. It has good test coverage (87%) but the documentation could use improvement. The maintainers are very responsive to issues, typically responding within 24 hours.",
    "Based on your preferred evaluation criteria from our previous discussions, this repository scores 8.7/10. It meets most of your requirements for activity and maintenance."
  ];

  // Function to get a random Rapy response
  const getRandomRapyResponse = () => {
    return rapyResponses[Math.floor(Math.random() * rapyResponses.length)];
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
      // In a real app, you'd send this to your backend AI service
      // For now, simulate a delay and response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newAssistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: getRandomRapyResponse(),
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
