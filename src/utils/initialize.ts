
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
  
  // Initialize GitHub API
  if (API_KEYS.GITHUB_TOKEN) {
    githubService.setApiKey(API_KEYS.GITHUB_TOKEN);
    console.log("GitHub API initialized");
  } else {
    console.warn("GitHub API token not found in environment");
    showToast("GitHub API", {
      description: "GitHub API token not found. Some features will be limited.",
    });
  }
  
  // Initialize Pinecone and OpenAI
  if (API_KEYS.PINECONE_API_KEY && API_KEYS.OPENAI_API_KEY) {
    pineconeService.configure({
      apiKey: API_KEYS.PINECONE_API_KEY,
      environment: API_KEYS.PINECONE_ENVIRONMENT,
      indexName: API_KEYS.PINECONE_INDEX,
      projectId: API_KEYS.PINECONE_PROJECT_ID,
      openaiApiKey: API_KEYS.OPENAI_API_KEY
    });
    console.log("Pinecone and OpenAI APIs initialized");
  } else {
    console.warn("Pinecone or OpenAI API tokens not found in environment");
    showToast("Vector DB", {
      description: "Pinecone or OpenAI API tokens not found. Memory features will be limited.",
    });
  }
  
  return {
    servicesAvailable: {
      github: githubService.isConfigured(),
      pinecone: pineconeService.isConfigured()
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

VITE_GITHUB_TOKEN=${API_KEYS.GITHUB_TOKEN}
VITE_PINECONE_API_KEY=${API_KEYS.PINECONE_API_KEY}
VITE_PINECONE_ENVIRONMENT=${API_KEYS.PINECONE_ENVIRONMENT}
VITE_PINECONE_INDEX=${API_KEYS.PINECONE_INDEX}
VITE_PINECONE_PROJECT_ID=${API_KEYS.PINECONE_PROJECT_ID || ""}
VITE_OPENAI_API_KEY=${API_KEYS.OPENAI_API_KEY}
`;
