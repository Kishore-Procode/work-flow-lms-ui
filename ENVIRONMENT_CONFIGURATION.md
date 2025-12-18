# Environment Configuration Guide

This document explains how the Student-ACT LMS UI application uses environment variables to configure API endpoints and other settings.

## Overview

The application now uses environment variables to configure API base URLs instead of hardcoding them. This makes it easy to deploy the application to different environments (development, staging, production) without code changes.

## Environment Variables

All environment variables for the frontend must be prefixed with `VITE_` to be accessible in the browser.

### Required Variables

- `VITE_API_BASE_URL`: The base URL for API endpoints (e.g., `http://localhost:3000/api/v1`)
- `VITE_API_HOST`: The host URL for the API server (e.g., `http://localhost:3000`)

### Optional Variables

- `VITE_APP_NAME`: Application name (default: "Student - ACT")
- `VITE_APP_VERSION`: Application version (default: "1.0.0")
- `VITE_EMAILJS_SERVICE_ID`: EmailJS service ID for email functionality
- `VITE_EMAILJS_TEMPLATE_ID`: EmailJS template ID
- `VITE_EMAILJS_PUBLIC_KEY`: EmailJS public key

## Configuration Files

### `.env` (Local Development)
```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_HOST=http://localhost:3000

# App Configuration
VITE_APP_NAME=Student - ACT
VITE_APP_VERSION=1.0.0
```

### `.env.example` (Template)
Contains example values and documentation for all available environment variables.

## Implementation Details

### Central Configuration
The configuration is centralized in `src/config/environment.ts`:

```typescript
export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    host: import.meta.env.VITE_API_HOST || 'http://localhost:3000',
  },
  // ... other config
};
```

### Image URL Helper
A utility function `getImageUrl()` is provided to construct proper image URLs:

```typescript
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  if (imagePath.startsWith('/uploads')) {
    return `${config.api.host}${imagePath}`;
  }
  return `${config.api.host}/uploads/${imagePath}`;
};
```

### Usage in Components
Components import and use the configuration:

```typescript
import { ApiService, getImageUrl } from '../../services/api';

// For API calls - automatically uses environment config
const data = await ApiService.getUsers();

// For image URLs
const imageUrl = getImageUrl(imagePath);
```

## Deployment Environments

### Development
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_API_HOST=http://localhost:3000
```

### Production
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_API_HOST=https://api.yourdomain.com
```

### Staging
```env
VITE_API_BASE_URL=https://staging-api.yourdomain.com/api/v1
VITE_API_HOST=https://staging-api.yourdomain.com
```

## Files Updated

The following files were updated to use environment variables:

1. `src/services/api.ts` - Main API service
2. `src/config/environment.ts` - Central configuration (new file)
3. `src/components/Dashboard/EnhancedStudentDashboard.tsx`
4. `src/components/Dashboard/StudentDashboard.tsx`
5. `src/components/TreeProgress/TreeProgress.tsx`
6. `src/components/Management/MyStudents.tsx`
7. `.env` - Environment variables file
8. `.env.example` - Template file (new)
9. `README.md` - Updated documentation

## Benefits

1. **Environment Flexibility**: Easy deployment to different environments
2. **Security**: No hardcoded URLs in the codebase
3. **Maintainability**: Central configuration management
4. **Development**: Easy switching between local and remote APIs
5. **Production Ready**: Proper configuration for production deployments

## Troubleshooting

### Common Issues

1. **API calls failing**: Check that `VITE_API_BASE_URL` is correctly set
2. **Images not loading**: Verify `VITE_API_HOST` is correct
3. **Environment variables not working**: Ensure they are prefixed with `VITE_`
4. **Changes not reflected**: Restart the development server after changing `.env`

### Debugging

You can check the current configuration in the browser console:

```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('API Host:', import.meta.env.VITE_API_HOST);
```

## Migration from Hardcoded URLs

All hardcoded `http://localhost:3000` URLs have been replaced with environment variable references. The application now automatically adapts to different environments based on the `.env` configuration.
