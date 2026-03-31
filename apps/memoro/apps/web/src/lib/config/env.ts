/**
 * Environment configuration helper
 * Provides type-safe access to environment variables
 */

import {
	PUBLIC_SUPABASE_URL,
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_MEMORO_MIDDLEWARE_URL,
	PUBLIC_MEMORO_SERVER_URL,
	PUBLIC_MANA_MIDDLEWARE_URL,
	PUBLIC_MIDDLEWARE_APP_ID,
	PUBLIC_STORAGE_BUCKET,
	PUBLIC_GOOGLE_CLIENT_ID,
	PUBLIC_APPLE_CLIENT_ID,
	PUBLIC_APPLE_REDIRECT_URI,
	PUBLIC_POSTHOG_KEY,
	PUBLIC_POSTHOG_HOST,
	PUBLIC_SENTRY_DSN,
} from '$env/static/public';

export const env = {
	// Supabase
	supabase: {
		url: PUBLIC_SUPABASE_URL,
		anonKey: PUBLIC_SUPABASE_ANON_KEY,
	},

	// API servers
	server: {
		memoroUrl: PUBLIC_MEMORO_SERVER_URL,
	},

	// Middleware APIs (legacy — kept for authService compatibility during migration)
	middleware: {
		memoroUrl: PUBLIC_MEMORO_MIDDLEWARE_URL,
		manaUrl: PUBLIC_MANA_MIDDLEWARE_URL,
		appId: PUBLIC_MIDDLEWARE_APP_ID,
	},

	// Storage
	storage: {
		bucket: PUBLIC_STORAGE_BUCKET,
	},

	// OAuth
	oauth: {
		googleClientId: PUBLIC_GOOGLE_CLIENT_ID,
		appleClientId: PUBLIC_APPLE_CLIENT_ID || '',
		appleRedirectUri: PUBLIC_APPLE_REDIRECT_URI || '',
	},

	// Analytics (optional)
	analytics: {
		posthog: {
			key: PUBLIC_POSTHOG_KEY || '',
			host: PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
		},
	},

	// Error tracking (optional)
	sentry: {
		dsn: PUBLIC_SENTRY_DSN || '',
	},
} as const;

// Helper to check if optional features are enabled
export const features = {
	hasPosthog: !!PUBLIC_POSTHOG_KEY,
	hasSentry: !!PUBLIC_SENTRY_DSN,
} as const;

// Log environment configuration on startup (useful for debugging deployment issues)
if (typeof window !== 'undefined') {
	console.log('🔧 Memoro Environment Configuration:', {
		supabase: !!env.supabase.url ? '✅ Configured' : '❌ Missing',
		middleware: !!env.middleware.memoroUrl ? '✅ Configured' : '❌ Missing',
		appleClientId: env.oauth.appleClientId || '❌ NOT SET',
		appleRedirectUri: env.oauth.appleRedirectUri || '❌ NOT SET',
		googleOAuth: !!env.oauth.googleClientId ? '✅ Configured' : '❌ Missing',
		posthog: features.hasPosthog ? '✅ Enabled' : '⚪ Disabled',
		sentry: features.hasSentry ? '✅ Enabled' : '⚪ Disabled',
	});

	// Specific warning for Apple Sign-In if not configured
	if (!env.oauth.appleClientId || !env.oauth.appleRedirectUri) {
		console.warn(
			'⚠️  Apple Sign-In not properly configured. Set PUBLIC_APPLE_CLIENT_ID and PUBLIC_APPLE_REDIRECT_URI in environment variables.'
		);
	}
}
