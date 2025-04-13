
/**
 * API Configuration
 * This file centralizes API configuration for the application
 */

// Default API keys from environment or hardcoded defaults
// In production, these should come from environment variables
export const API_KEYS = {
  // GitHub API
  GITHUB_TOKEN: import.meta.env.VITE_GITHUB_TOKEN || "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",

  // Pinecone Vector DB
  PINECONE_API_KEY: import.meta.env.VITE_PINECONE_API_KEY || "pcsk_2URAax_Myr77sDVt9VBAP5rk9pNdi61PfaMVy1VKqMk2iLxjW5RmyLQxsfTHuHE9ScQHYH",
  PINECONE_ENVIRONMENT: import.meta.env.VITE_PINECONE_ENVIRONMENT || "gcp-starter",
  PINECONE_INDEX: import.meta.env.VITE_PINECONE_INDEX || "anarepo-index",
  PINECONE_PROJECT_ID: import.meta.env.VITE_PINECONE_PROJECT_ID || "",

  // OpenAI API (for embeddings)
  OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY || "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",
};

// API endpoints
export const API_ENDPOINTS = {
  GITHUB_API: "https://api.github.com",
  OPENAI_API: "https://api.openai.com/v1",
};

// Service configuration
export const SERVICE_CONFIG = {
  // Auto-initialize services with default keys
  autoInitialize: true,
  
  // Default Pinecone settings
  pinecone: {
    indexName: API_KEYS.PINECONE_INDEX,
    namespace: "anarepo-memories",
  }
};
