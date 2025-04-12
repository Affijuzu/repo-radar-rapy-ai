
import React from 'react';
import { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  isLatest?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn(
      "flex gap-3",
      isUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className={cn("h-8 w-8", isUser ? "bg-primary/10" : "bg-secondary")}>
        {isUser ? (
          <AvatarFallback>U</AvatarFallback>
        ) : (
          <>
            <AvatarImage src="/rapy-avatar.png" alt="Rapy AI" />
            <AvatarFallback>AI</AvatarFallback>
          </>
        )}
      </Avatar>
      
      <Card className={cn(
        "max-w-[85%] shadow-sm",
        isUser ? "bg-primary text-primary-foreground" : ""
      )}>
        <CardContent className={cn("p-3", !isUser && "prose prose-sm dark:prose-invert")}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const {children, className, node, ...rest} = props;
                  const match = /language-(\w+)/.exec(className || '');
                  return match ? (
                    <SyntaxHighlighter
                      {...rest}
                      language={match[1]}
                      style={vscDarkPlus}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code {...rest} className={className}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </Markdown>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatMessage;
