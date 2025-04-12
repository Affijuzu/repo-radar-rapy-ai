
import React, { useEffect, useState } from 'react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import { ArrowUpRight } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const [showTimestamp, setShowTimestamp] = useState(false);
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  return (
    <div
      className={cn(
        "flex gap-3 py-4 px-4 transition-colors",
        message.role === 'user' ? "bg-muted/50" : "bg-background",
        isLatest && "animate-fade-in"
      )}
      onMouseEnter={() => setShowTimestamp(true)}
      onMouseLeave={() => setShowTimestamp(false)}
    >
      <div className="flex flex-col relative">
        <div 
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm",
            message.role === 'assistant' ? "bg-purple-600" : "bg-stone-600"
          )}
        >
          {message.role === 'assistant' ? 'R' : 'U'}
        </div>
        {showTimestamp && (
          <div className="absolute top-10 left-0 text-xs text-muted-foreground">
            {formatter.format(message.timestamp)}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <h4 className="text-sm font-semibold mb-2">
          {message.role === 'assistant' ? 'Rapy' : 'You'}
        </h4>
        <div className="prose prose-sm dark:prose-invert max-w-none overflow-auto">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ node, ...props }) => (
                <a 
                  {...props} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline flex items-center"
                >
                  {props.children}
                  <ArrowUpRight className="ml-1 h-3 w-3" />
                </a>
              ),
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto">
                    <table className="border-collapse border border-slate-400 w-full">
                      {children}
                    </table>
                  </div>
                );
              },
              th({ children }) {
                return (
                  <th className="border border-slate-300 p-2 bg-slate-100 dark:bg-slate-800 font-semibold text-left">
                    {children}
                  </th>
                );
              },
              td({ children }) {
                return (
                  <td className="border border-slate-300 p-2">
                    {children}
                  </td>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
