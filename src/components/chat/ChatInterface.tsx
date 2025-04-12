
import React, { useEffect, useState } from 'react';
import ChatWindow from './ChatWindow';
import ChatHistory from './ChatHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { PanelLeft, PanelLeftClose, Settings, InfoIcon, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useChat } from '@/contexts/ChatContext';
import { Card } from '@/components/ui/card';

const ChatInterface: React.FC = () => {
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [showInfo, setShowInfo] = useState(true);
  const { messages } = useChat();
  
  useEffect(() => {
    // Automatically hide the sidebar on mobile
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [isMobile]);
  
  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Chat History Sidebar */}
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
      
      {/* Main Chat Area */}
      <div className="flex-1 relative flex flex-col">
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
        
        {/* Welcome/Info Card */}
        {messages.length === 0 && showInfo && (
          <div className="absolute top-14 left-0 right-0 z-10 px-4">
            <Card className="bg-background/95 backdrop-blur p-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-2">
                  <InfoIcon className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-lg">Welcome to ANAREPO with Rapy AI</h3>
                    <p className="text-muted-foreground mb-3">
                      I can help you analyze GitHub repositories and make informed decisions about which open-source projects to use.
                    </p>
                    <div className="space-y-2 text-sm">
                      <p className="font-medium">Try asking me:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Analyze <code className="bg-muted px-1 py-0.5 rounded">facebook/react</code> repository</li>
                        <li>What are the most active React state management libraries?</li>
                        <li>Show me my previously evaluated repositories</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowInfo(false)} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        <ChatWindow />
      </div>
    </div>
  );
};

export default ChatInterface;
