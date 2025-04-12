
import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
      <Card className="w-full max-w-md glass-card">
        <CardContent className="pt-6">
          {isLogin ? (
            <LoginForm onToggle={toggleForm} />
          ) : (
            <RegisterForm onToggle={toggleForm} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthModal;
