
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
  
  // Helper function to determine if content is an error message
  const isErrorMessage = (content: string) => {
    return content.includes("Error") || 
           content.includes("error") || 
           content.includes("couldn't find") || 
           content.includes("failed") ||
           content.includes("doesn't exist");
  };
  
  // Custom renderer for repository analysis
  const renderRepoAnalysis = (content: string) => {
    if (content.startsWith('Analysis of')) {
      return (
        <div className="repo-analysis">
          {content.split('\n').map((line, index) => {
            if (line.includes('✅ Present')) {
              return (
                <div key={index} className="flex">
                  <span className="flex-grow">{line.split('✅ Present')[0]}</span> 
                  <span className="text-green-500 font-semibold">✅ Present</span>
                </div>
              );
            } else if (line.includes('❌ Missing')) {
              return (
                <div key={index} className="flex">
                  <span className="flex-grow">{line.split('❌ Missing')[0]}</span> 
                  <span className="text-red-500 font-semibold">❌ Missing</span>
                </div>
              );
            } else {
              return <div key={index}>{line}</div>;
            }
          })}
        </div>
      );
    }
    return null;
  };
  
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
        isUser ? "bg-primary text-primary-foreground" : "",
        isErrorMessage(message.content) && !isUser ? "border-red-300" : ""
      )}>
        <CardContent className={cn("p-3", !isUser && "prose prose-sm dark:prose-invert")}>
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <>
              {renderRepoAnalysis(message.content) || (
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatMessage;
