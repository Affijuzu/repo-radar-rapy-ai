
import { useState, useEffect } from 'react';
import { ChatHistoryItem, Message } from '@/types/chat';
import { User } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';
import pineconeService from '@/services/pinecone';

interface ChatHistoryHook {
  chatHistory: ChatHistoryItem[];
  saveNewConversation: (user: User, messages: Message[]) => Promise<void>;
  updateExistingConversation: (user: User, messages: Message[]) => Promise<void>;
  loadChatHistory: (chatId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => void;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;
}

export const useChatHistory = (user: User | null): ChatHistoryHook => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

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

  const saveNewConversation = async (user: User, messages: Message[]) => {
    const userMessage = messages.find(m => m.role === 'user');
    const newChatHistory: ChatHistoryItem = {
      id: uuidv4(),
      title: userMessage ? userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '') : 'New conversation',
      snippet: userMessage?.content || '',
      timestamp: new Date(),
      messages
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
  };

  const updateExistingConversation = async (user: User, messages: Message[]) => {
    const updatedHistory = chatHistory.map((item, index) => {
      if (index === 0) {
        return {
          ...item,
          messages
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
  };

  const loadChatHistory = (chatId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setMessages(chat.messages);
    }
  };

  return {
    chatHistory,
    saveNewConversation,
    updateExistingConversation,
    loadChatHistory,
    setChatHistory
  };
};
