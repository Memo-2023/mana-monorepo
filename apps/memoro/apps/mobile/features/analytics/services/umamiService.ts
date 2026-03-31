import { Platform } from 'react-native';
import type { AnalyticsService, AnalyticsProperties, UserProperties } from '../types';

declare global {
	interface Window {
		umami?: {
			track: (event: string | ((props?: any) => void), properties?: any) => void;
			identify: (properties: any) => void;
		};
	}
}

class UmamiAnalyticsService implements AnalyticsService {
	private initialized = false;
	private websiteId =
		process.env.EXPO_PUBLIC_UMAMI_WEBSITE_ID || 'fb5fc77a-ed24-4369-b9f5-7d8a01bc9fa4';
	private scriptUrl =
		process.env.EXPO_PUBLIC_UMAMI_SCRIPT_URL || 'https://umami.manacore.ai/script.js';

	async initialize() {
		if (this.initialized) return;

		// Only initialize on web platform
		if (Platform.OS !== 'web') {
			console.log('[Umami] Skipping initialization - not on web platform');
			return;
		}

		try {
			// Check if Umami is already loaded
			if (typeof window !== 'undefined' && window.umami) {
				this.initialized = true;
				console.log('[Umami] Already loaded');
				return;
			}

			// Create and append the script tag
			if (typeof document !== 'undefined') {
				const script = document.createElement('script');
				script.async = true;
				script.defer = true;
				script.src = this.scriptUrl;
				script.setAttribute('data-website-id', this.websiteId);

				script.onload = () => {
					this.initialized = true;
					console.log('[Umami] Loaded successfully');

					// Track initialization
					this.track('analytics_initialized', {
						platform: 'web',
						service: 'umami',
						timestamp: new Date().toISOString(),
					});
				};

				script.onerror = (error) => {
					console.error('[Umami] Failed to load script:', error);
				};

				document.head.appendChild(script);
			}
		} catch (error) {
			console.error('[Umami] Failed to initialize:', error);
		}
	}

	identify(userId: string, properties?: UserProperties) {
		if (!this.initialized || Platform.OS !== 'web') return;

		try {
			// Umami doesn't have native identify, but we can track it as a custom event
			if (window.umami) {
				window.umami.track('user_identified', {
					userId,
					...properties,
				});
			}
			console.log('[Umami] User identified:', userId, properties);
		} catch (error) {
			console.warn('[Umami] Failed to identify user:', error);
		}
	}

	track(event: string, properties?: AnalyticsProperties) {
		if (!this.initialized || Platform.OS !== 'web') return;

		try {
			if (window.umami) {
				// Umami expects event name and optional data object
				window.umami.track(event, properties);
			}
			console.log('[Umami] Event tracked:', event, properties);
		} catch (error) {
			console.warn('[Umami] Failed to track event:', error);
		}
	}

	screen(screenName: string, properties?: AnalyticsProperties) {
		if (!this.initialized || Platform.OS !== 'web') return;

		try {
			// Track screen views as page views with custom properties
			if (window.umami) {
				window.umami.track('screen_view', {
					screen: screenName,
					...properties,
				});
			}
			console.log('[Umami] Screen tracked:', screenName, properties);
		} catch (error) {
			console.warn('[Umami] Failed to track screen:', error);
		}
	}

	reset() {
		if (!this.initialized || Platform.OS !== 'web') return;

		try {
			// Umami doesn't have a reset method, but we can track it as an event
			if (window.umami) {
				window.umami.track('user_reset');
			}
			console.log('[Umami] User reset');
		} catch (error) {
			console.warn('[Umami] Failed to reset:', error);
		}
	}
}

export const umamiService = new UmamiAnalyticsService();
