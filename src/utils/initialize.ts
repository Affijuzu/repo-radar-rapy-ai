
import { DEPLOYMENT_CONFIG, initializeServices } from '@/config/deployment';
import { API_KEYS } from '@/config/apiConfig';
import githubService from '@/services/github';
import pineconeService from '@/services/pinecone';
import { toast as showToast } from 'sonner';

/**
 * Initialize the application and connect to required services
 */
export const initializeApp = async () => {
  // Initialize deployment settings
  initializeServices();
  
  // Check if GitHub API is configured
  const githubConfigured = githubService.isConfigured();
  if (!githubConfigured) {
    console.warn("GitHub API not properly configured");
    showToast("GitHub API", {
      description: "GitHub API is not properly configured. Some features will be limited.",
    });
  } else {
    console.log("GitHub API initialized");
  }
  
  // Check if Pinecone is configured
  const pineconeConfigured = pineconeService.isConfigured();
  if (!pineconeConfigured) {
    console.warn("Memory system not properly configured");
    showToast("Memory System", {
      description: "Memory system is not properly configured. Some features will be limited.",
    });
  } else {
    console.log("Memory system initialized");
  }
  
  return {
    servicesAvailable: {
      github: githubConfigured,
      pinecone: pineconeConfigured
    }
  };
};

/**
 * Create a .env file guide for deployment
 */
export const generateEnvFileGuide = () => `
# ANAREPO API Keys
# Copy this to your .env file for local development
# For production deployment, set these in your hosting environment

VITE_SUPABASE_URL=${import.meta.env.VITE_SUPABASE_URL || "https://ujpdzlhtoehfhbakqieg.supabase.co"}
VITE_SUPABASE_ANON_KEY=${import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqcGR6bGh0b2VoZmhiYWtxaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MjQ0MjgsImV4cCI6MjA2MDEwMDQyOH0.vM0NliqvwFlh4cfRG0-E9LvpL80U5KFmjlCtmqz8-4g"}
`;
