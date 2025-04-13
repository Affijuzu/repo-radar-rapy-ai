
import { useState, useEffect } from 'react';
import { ChatHistoryItem, Message } from '@/types/chat';
import { User } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from '@/hooks/use-toast';

interface ChatHistoryHook {
  chatHistory: ChatHistoryItem[];
  saveNewConversation: (user: User, messages: Message[]) => Promise<void>;
  updateExistingConversation: (user: User, messages: Message[]) => Promise<void>;
  loadChatHistory: (chatId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => Promise<void>;
  setChatHistory: React.Dispatch<React.SetStateAction<ChatHistoryItem[]>>;
}

export const useChatHistory = (user: User | null): ChatHistoryHook => {
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const { toast } = useToast();

  // Fetch chat history when user changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!user) {
        setChatHistory([]);
        return;
      }

      try {
        const { data: chats, error } = await supabase
          .from('chat_history')
          .select('id, title, snippet, created_at, updated_at')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (chats) {
          const formattedChats: ChatHistoryItem[] = chats.map(chat => ({
            id: chat.id,
            title: chat.title,
            snippet: chat.snippet || '',
            timestamp: new Date(chat.created_at),
            messages: [] // We'll load messages on demand
          }));
          setChatHistory(formattedChats);
        }
      } catch (error: any) {
        console.error("Error fetching chat history:", error);
        toast({
          variant: 'destructive',
          title: 'Error loading chat history',
          description: error.message,
        });
      }
    };

    fetchChatHistory();
  }, [user, toast]);

  const saveNewConversation = async (user: User, messages: Message[]) => {
    if (!user || messages.length === 0) return;
    
    const userMessage = messages.find(m => m.role === 'user');
    if (!userMessage) return;
    
    try {
      // Create a new chat history entry
      const { data: chatData, error: chatError } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
          snippet: userMessage.content,
        })
        .select('id')
        .single();

      if (chatError) throw chatError;
      
      if (!chatData) throw new Error('Failed to create chat history');
      
      const chatId = chatData.id;
      
      // Insert all messages
      const messagesToInsert = messages.map(msg => ({
        chat_id: chatId,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.timestamp).toISOString()
      }));
      
      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messagesToInsert);
      
      if (messagesError) throw messagesError;
      
      // Update local state
      const newChatHistoryItem: ChatHistoryItem = {
        id: chatId,
        title: userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
        snippet: userMessage.content,
        timestamp: new Date(),
        messages
      };
      
      setChatHistory(prev => [newChatHistoryItem, ...prev]);
      
    } catch (error: any) {
      console.error("Error saving conversation:", error);
      toast({
        variant: 'destructive',
        title: 'Error saving conversation',
        description: error.message,
      });
    }
  };

  const updateExistingConversation = async (user: User, messages: Message[]) => {
    if (!user || messages.length === 0 || chatHistory.length === 0) return;
    
    try {
      const currentChatId = chatHistory[0].id;
      
      // Update the chat history timestamp
      const { error: updateError } = await supabase
        .from('chat_history')
        .update({ 
          updated_at: new Date().toISOString() 
        })
        .eq('id', currentChatId);
      
      if (updateError) throw updateError;
      
      // Get the new messages that need to be inserted
      const existingMessageIds = chatHistory[0].messages.map(m => m.id);
      const newMessages = messages.filter(m => !existingMessageIds.includes(m.id));
      
      if (newMessages.length === 0) return;
      
      // Insert the new messages
      const messagesToInsert = newMessages.map(msg => ({
        chat_id: currentChatId,
        role: msg.role,
        content: msg.content,
        created_at: new Date(msg.timestamp).toISOString()
      }));
      
      const { error: messagesError } = await supabase
        .from('messages')
        .insert(messagesToInsert);
      
      if (messagesError) throw messagesError;
      
      // Update local state
      const updatedChatHistory = chatHistory.map((item, index) => {
        if (index === 0) {
          return {
            ...item,
            messages,
            timestamp: new Date()
          };
        }
        return item;
      });
      
      setChatHistory(updatedChatHistory);
      
    } catch (error: any) {
      console.error("Error updating conversation:", error);
      toast({
        variant: 'destructive',
        title: 'Error updating conversation',
        description: error.message,
      });
    }
  };

  const loadChatHistory = async (chatId: string, setMessages: React.Dispatch<React.SetStateAction<Message[]>>) => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (messagesData) {
        const loadedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }));
        
        // Update the message state
        setMessages(loadedMessages);
        
        // Update the chat history local state
        const updatedChatHistory = chatHistory.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: loadedMessages
            };
          }
          return chat;
        });
        
        setChatHistory(updatedChatHistory);
      }
    } catch (error: any) {
      console.error("Error loading chat messages:", error);
      toast({
        variant: 'destructive',
        title: 'Error loading chat',
        description: error.message,
      });
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
