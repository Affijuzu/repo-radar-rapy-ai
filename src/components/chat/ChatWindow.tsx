
import React, { useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Bot } from 'lucide-react';

const ChatWindow: React.FC = () => {
  const { messages, isLoading } = useChat();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full glass-card">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                  <Bot size={32} className="text-primary" />
                </div>
              </div>
              <h3 className="text-lg font-medium mb-2">Welcome to Rapy AI</h3>
              <p className="text-muted-foreground text-sm mb-4">
                I can help you evaluate GitHub repositories and open-source projects.
                Try asking me about popular libraries, or analyzing specific repositories!
              </p>
              <div className="text-sm text-left space-y-2">
                <p className="bg-secondary p-2 rounded-md">
                  "What are the most active React state management libraries right now?"
                </p>
                <p className="bg-secondary p-2 rounded-md">
                  "Can you analyze the documentation quality for vuejs/vue?"
                </p>
                <p className="bg-secondary p-2 rounded-md">
                  "Compare django/django with flask/flask"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      )}
      <ChatInput />
    </div>
  );
};

export default ChatWindow;
