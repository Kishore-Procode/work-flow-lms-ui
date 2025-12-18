// Environment configuration for the frontend application
// All environment variables must be prefixed with VITE_ to be accessible in the browser

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    host: import.meta.env.VITE_API_HOST || 'http://localhost:3000',
  },
  
  // Development configuration
  development: {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
  },
  
  // App configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Student-ACT LMS',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
};

// Utility function to get full image URL
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads')) {
    return `${config.api.host}${imagePath}`;
  }
  return `${config.api.host}/uploads/${imagePath}`;
};

// Export individual values for convenience
export const API_BASE_URL = config.api.baseUrl;
export const API_HOST = config.api.host;
