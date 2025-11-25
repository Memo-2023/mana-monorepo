import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

export function initPostHog() {
	const posthogKey = env.PUBLIC_POSTHOG_KEY;
	const posthogHost = env.PUBLIC_POSTHOG_HOST;

	if (browser && posthogKey && posthogHost) {
		posthog.init(posthogKey, {
			api_host: posthogHost,
			person_profiles: 'identified_only', // Only track identified users
			capture_pageview: true, // Automatically capture pageviews
			capture_pageleave: true, // Track when users leave pages
			// Privacy-friendly settings
			opt_out_capturing_by_default: false,
			persistence: 'localStorage',
			autocapture: false, // Disable automatic event capture for better control
			// Session recording (optional - can be disabled)
			disable_session_recording: true, // Set to false if you want session recordings
			// Performance
			loaded: (posthog) => {
				if (import.meta.env.DEV) {
					console.log('PostHog loaded');
				}
			}
		});
	}
}

// Helper functions for common tracking events
export const analytics = {
	// Track page view (usually automatic, but available for manual tracking)
	pageView: (url?: string) => {
		if (browser) {
			posthog.capture('$pageview', { url: url || window.location.href });
		}
	},

	// Identify a user
	identify: (userId: string, properties?: Record<string, any>) => {
		if (browser) {
			posthog.identify(userId, properties);
		}
	},

	// Track custom events
	track: (eventName: string, properties?: Record<string, any>) => {
		if (browser) {
			posthog.capture(eventName, properties);
		}
	},

	// Reset user identity (e.g., on logout)
	reset: () => {
		if (browser) {
			posthog.reset();
		}
	},

	// Set user properties
	setUserProperties: (properties: Record<string, any>) => {
		if (browser) {
			posthog.setPersonProperties(properties);
		}
	},

	// Feature flags
	isFeatureEnabled: (featureKey: string): boolean => {
		if (browser) {
			return posthog.isFeatureEnabled(featureKey) ?? false;
		}
		return false;
	},

	// Get feature flag value
	getFeatureFlag: (featureKey: string): string | boolean | undefined => {
		if (browser) {
			return posthog.getFeatureFlag(featureKey);
		}
		return undefined;
	}
};

export default posthog;
