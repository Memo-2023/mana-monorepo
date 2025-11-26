/**
 * Environment configuration helper for Nutriphi Web
 * Provides type-safe access to environment variables
 */

import { env as dynamicEnv } from '$env/dynamic/public';

export const env = {
  // Middleware APIs
  middleware: {
    nutriphiUrl: dynamicEnv.PUBLIC_NUTRIPHI_MIDDLEWARE_URL ?? 'https://api.manacore.de',
    appId: dynamicEnv.PUBLIC_MIDDLEWARE_APP_ID ?? 'nutriphi'
  },

  // Backend API
  backend: {
    url: dynamicEnv.PUBLIC_BACKEND_URL ?? 'http://localhost:3002'
  },

  // OAuth
  oauth: {
    googleClientId: dynamicEnv.PUBLIC_GOOGLE_CLIENT_ID ?? '',
    appleClientId: dynamicEnv.PUBLIC_APPLE_CLIENT_ID ?? '',
    appleRedirectUri: dynamicEnv.PUBLIC_APPLE_REDIRECT_URI ?? ''
  }
} as const;

// Helper to check if optional features are enabled
export const features = {
  hasGoogleAuth: !!env.oauth.googleClientId,
  hasAppleAuth: !!env.oauth.appleClientId && !!env.oauth.appleRedirectUri
} as const;

// Log environment configuration on startup (useful for debugging deployment issues)
if (typeof window !== 'undefined') {
  console.log('Nutriphi Environment Configuration:', {
    middleware: !!env.middleware.nutriphiUrl ? 'Configured' : 'Missing',
    backend: !!env.backend.url ? 'Configured' : 'Missing',
    googleOAuth: features.hasGoogleAuth ? 'Enabled' : 'Disabled',
    appleOAuth: features.hasAppleAuth ? 'Enabled' : 'Disabled'
  });
}
