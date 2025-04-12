
import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ChatHistory: React.FC = () => {
  const { chatHistory, loadChatHistory, clearChat } = useChat();

  const handleNewChat = () => {
    clearChat();
  };

  const handleSelectChat = (chatId: string) => {
    loadChatHistory(chatId);
  };

  return (
    <div className="flex flex-col h-full border-r">
      <div className="p-4">
        <Button 
          onClick={handleNewChat} 
          variant="outline" 
          className="w-full flex items-center gap-2"
        >
          <PlusCircle size={16} />
          <span>New Chat</span>
        </Button>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chatHistory.length > 0 ? (
            chatHistory.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start text-left overflow-hidden h-auto py-3"
                onClick={() => handleSelectChat(item.id)}
              >
                <div className="flex gap-2 items-start w-full">
                  <MessageSquare size={16} className="flex-shrink-0 mt-1" />
                  <div className="truncate flex-1 flex flex-col items-start">
                    <span className="font-medium truncate w-full">{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </Button>
            ))
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No chat history yet
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatHistory;
