
import React from 'react';
import ChatWindow from './ChatWindow';
import ChatHistory from './ChatHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelLeftClose, Settings } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ChatInterface: React.FC = () => {
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {!isMobile && showSidebar && (
        <div className="w-64 h-full">
          <ChatHistory />
        </div>
      )}
      
      {isMobile && showSidebar && (
        <div className="absolute inset-0 z-20 bg-background">
          <ChatHistory />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2" 
            onClick={() => setShowSidebar(false)}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 relative">
        {(!showSidebar || isMobile) && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 left-2 z-10" 
            onClick={() => setShowSidebar(true)}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
        )}
        
        <Link to="/settings" className="absolute top-2 right-2 z-10">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
        
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatInterface;
