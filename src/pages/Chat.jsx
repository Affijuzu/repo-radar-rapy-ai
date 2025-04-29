
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import ChatInterface from '@/components/chat/ChatInterface';
import { ChatProvider } from '@/contexts/ChatContext';

const Chat = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1">
        <ChatProvider>
          <ChatInterface />
        </ChatProvider>
      </div>
    </div>
  );
};

export default Chat;
