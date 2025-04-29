
import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { generateResponse } from '@/services/responseService';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useUserMemory } from '@/hooks/useUserMemory';

const ChatContext = createContext(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { userMemory } = useUserMemory(user);
  const { chatHistory, saveNewConversation, updateExistingConversation, loadChatHistory: loadChat } = useChatHistory(user);

  const sendMessage = async (content) => {
    if (!content.trim()) return;
    
    const newUserMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Generate response using our helper function
      const responseContent = await generateResponse(content, user, userMemory);
      
      const newAssistantMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, newUserMessage, newAssistantMessage];
      setMessages(updatedMessages);
      
      // If this is a new conversation, save it to history
      if (user && messages.length <= 1) {
        await saveNewConversation(user, updatedMessages);
      } else if (user) {
        // Update existing conversation
        await updateExistingConversation(user, updatedMessages);
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

  const loadChatHistory = (chatId) => {
    loadChat(chatId, setMessages);
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
