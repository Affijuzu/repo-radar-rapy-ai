
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, Credentials, RegisterData } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType extends AuthState {
  login: (credentials: Credentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    error: null,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem('anarepo_user');
    if (savedUser) {
      try {
        setState({
          user: JSON.parse(savedUser),
          isLoading: false,
          error: null
        });
      } catch (e) {
        localStorage.removeItem('anarepo_user');
        setState({
          user: null,
          isLoading: false,
          error: null
        });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (credentials: Credentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // In a real app, you would make an API call here
      // For now, we'll simulate a successful login with mock data
      const user: User = {
        id: '1',
        name: 'Demo User',
        email: credentials.email,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${credentials.email}`
      };
      
      localStorage.setItem('anarepo_user', JSON.stringify(user));
      setState({
        user,
        isLoading: false,
        error: null
      });
      toast({
        title: 'Welcome back!',
        description: 'You have been successfully logged in.',
      });
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: 'Invalid credentials. Please try again.'
      });
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Invalid credentials. Please try again.',
      });
    }
  };

  const register = async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      // In a real app, you would make an API call here
      // For now, we'll simulate a successful registration
      const user: User = {
        id: '1',
        name: data.name,
        email: data.email,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`
      };
      
      localStorage.setItem('anarepo_user', JSON.stringify(user));
      setState({
        user,
        isLoading: false,
        error: null
      });
      toast({
        title: 'Registration successful!',
        description: 'Your account has been created.',
      });
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        error: 'Registration failed. Please try again.'
      });
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: 'Please try again with different credentials.',
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('anarepo_user');
    setState({
      user: null,
      isLoading: false,
      error: null
    });
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
