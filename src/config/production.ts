
/**
 * Production configuration
 * This file contains settings specific to production deployment
 */

export const PRODUCTION_CONFIG = {
  // Set this to true when deploying to production
  enableProduction: true,
  
  // Analytics and monitoring
  enableAnalytics: true,
  enableErrorReporting: true,
  
  // Performance optimizations
  enableCaching: true,
  cacheExpirationMinutes: 60,
  
  // Deployment information
  deploymentVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  deploymentEnvironment: import.meta.env.VITE_APP_ENVIRONMENT || 'production',
  
  // Rate limiting
  rateLimiting: {
    enabled: true,
    maxRequestsPerMinute: 60
  }
};

/**
 * Initialize production services
 */
export const initializeProductionServices = () => {
  // This would be expanded with actual production service initialization
  console.log(`Initializing production environment (${PRODUCTION_CONFIG.deploymentVersion})`);
  
  // Set up error tracking
  if (PRODUCTION_CONFIG.enableErrorReporting) {
    window.addEventListener('error', (event) => {
      // In a real implementation, would send to error reporting service
      console.error('Global error:', event.error);
    });
  }
  
  // Set up performance tracking
  if (PRODUCTION_CONFIG.enableAnalytics) {
    // Web Vitals or similar would be initialized here
    console.log('Production analytics enabled');
  }
};
