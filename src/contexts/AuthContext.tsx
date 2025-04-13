
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState, Credentials, RegisterData } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { toast as showToast } from 'sonner';

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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          const user: User = {
            id: session.user.id,
            name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
            email: session.user.email || '',
            avatarUrl: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`
          };
          setState({
            user,
            isLoading: false,
            error: null
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            error: null
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const user: User = {
          id: session.user.id,
          name: session.user.user_metadata.name || session.user.email?.split('@')[0] || '',
          email: session.user.email || '',
          avatarUrl: session.user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`
        };
        setState({
          user,
          isLoading: false,
          error: null
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          error: null
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: Credentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully logged in.',
        });
      }
    } catch (error: any) {
      setState({
        user: null,
        isLoading: false,
        error: error.message || 'Invalid credentials. Please try again.'
      });
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Invalid credentials. Please try again.',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const register = async (data: RegisterData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
          }
        }
      });

      if (error) {
        throw error;
      }

      if (authData.user) {
        toast({
          title: 'Registration successful!',
          description: 'Your account has been created.',
        });
        
        showToast('Email verification', {
          description: 'Please check your email to verify your account',
        });
      }
    } catch (error: any) {
      setState({
        user: null,
        isLoading: false,
        error: error.message || 'Registration failed. Please try again.'
      });
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error.message || 'Please try again with different credentials.',
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error signing out',
        description: error.message,
      });
      return;
    }
    
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
