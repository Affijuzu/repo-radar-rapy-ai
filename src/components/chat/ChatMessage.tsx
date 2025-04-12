
import React from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const { user } = useAuth();
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "flex items-start gap-3 my-4 p-4 rounded-lg animate-fade-in",
        isUser ? "bg-secondary" : "bg-purple-50 dark:bg-purple-900/20"
      )}
    >
      <Avatar className="w-8 h-8">
        {isUser ? (
          <>
            <AvatarImage src={user?.avatarUrl} alt={user?.name || 'User'} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </>
        ) : (
          <>
            <AvatarImage src="/rapy-avatar.png" alt="Rapy AI" />
            <AvatarFallback>RA</AvatarFallback>
          </>
        )}
      </Avatar>
      <div className="flex flex-col">
        <div className="flex items-center mb-1">
          <span className="font-medium">
            {isUser ? user?.name || 'You' : 'Rapy AI'}
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
