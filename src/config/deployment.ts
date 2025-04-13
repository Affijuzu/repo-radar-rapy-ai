
/**
 * Deployment configuration
 * This file contains settings related to application deployment
 */

export const DEPLOYMENT_CONFIG = {
  // Application info
  APP_NAME: "ANAREPO with Rapy AI",
  APP_VERSION: "1.0.0",
  
  // Environment detection
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  
  // Analytics (placeholder - implement with your preferred analytics provider)
  enableAnalytics: import.meta.env.PROD,
  
  // Error reporting
  enableErrorReporting: import.meta.env.PROD,

  // Feature flags
  features: {
    enableVectorSearch: true,
    enableChatHistory: true,
    enableUserPreferences: true,
  }
};

// Initialize services based on environment
export const initializeServices = () => {
  // This function would handle any environment-specific initialization
  console.log(`Initializing ${DEPLOYMENT_CONFIG.APP_NAME} v${DEPLOYMENT_CONFIG.APP_VERSION}`);
  console.log(`Environment: ${DEPLOYMENT_CONFIG.isProd ? 'Production' : 'Development'}`);
  
  // Set up error handling for production
  if (DEPLOYMENT_CONFIG.enableErrorReporting) {
    window.addEventListener('error', (event) => {
      // In a real app, you'd send this to your error reporting service
      console.error('Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      // In a real app, you'd send this to your error reporting service
      console.error('Unhandled Promise rejection:', event.reason);
    });
  }
};
