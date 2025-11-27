/**
 * PostHog Analytics Service
 *
 * Comprehensive analytics tracking for user behavior, feature usage,
 * performance metrics, and errors.
 */

import PostHog from 'posthog-react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Types for analytics events
export type AnalyticsEvent = {
	// Authentication Events
	auth_signup_started: { method: 'email' | 'google' | 'apple' };
	auth_signup_completed: { method: 'email' | 'google' | 'apple'; userId: string };
	auth_signup_failed: { method: 'email' | 'google' | 'apple'; error: string };
	auth_signin_started: { method: 'email' | 'google' | 'apple' };
	auth_signin_completed: { method: 'email' | 'google' | 'apple'; userId: string };
	auth_signin_failed: { method: 'email' | 'google' | 'apple'; error: string };
	auth_signout: { userId: string };
	auth_token_refresh: { success: boolean };

	// Story Events
	story_creation_started: { characterId: string; characterName: string };
	story_prompt_entered: { promptLength: number; language: string };
	story_generation_completed: {
		storyId: string;
		characterId: string;
		duration: number;
		pageCount: number;
		language: string;
	};
	story_generation_failed: { characterId: string; error: string; duration: number };
	story_viewed: { storyId: string; title: string };
	story_page_changed: { storyId: string; pageNumber: number; totalPages: number };
	story_shared: { storyId: string; method: string };
	story_deleted: { storyId: string };
	story_text_edited: { storyId: string; pageNumber: number; editLength: number };
	story_regeneration_started: { storyId: string; pageNumber: number };

	// Story Engagement Events
	story_session_started: {
		storyId: string;
		title: string;
		pageCount: number;
	};
	story_session_ended: {
		storyId: string;
		duration: number;
		pagesViewed: number;
		completed: boolean;
		furthestPage: number;
	};
	story_page_viewed: {
		storyId: string;
		pageNumber: number;
		totalPages: number;
		isStartScreen: boolean;
		isEndScreen: boolean;
	};
	story_page_duration: {
		storyId: string;
		pageNumber: number;
		duration: number;
		isStartScreen: boolean;
		isEndScreen: boolean;
	};
	story_completed: {
		storyId: string;
		totalDuration: number;
		pageCount: number;
		averagePageDuration: number;
	};
	story_abandoned: {
		storyId: string;
		lastPage: number;
		totalPages: number;
		duration: number;
		completionPercentage: number;
	};
	story_restarted: {
		storyId: string;
		fromPage: number;
	};
	story_end_button_clicked: {
		storyId: string;
		title: string;
	};
	story_restart_button_clicked: {
		storyId: string;
		fromPage: number;
	};
	story_archive_button_clicked: {
		storyId: string;
		title: string;
	};
	story_archived: {
		storyId: string;
		title: string;
	};

	// Character Events
	character_creation_started: { method: 'description' | 'photo' };
	character_description_entered: { descriptionLength: number };
	character_photo_selected: { source: 'camera' | 'gallery' };
	character_generation_completed: {
		characterId: string;
		name: string;
		method: 'description' | 'photo';
		duration: number;
	};
	character_generation_failed: { method: 'description' | 'photo'; error: string; duration: number };
	character_viewed: { characterId: string; characterName: string };
	character_edited: { characterId: string; field: string };
	character_deleted: { characterId: string };
	character_shared: { characterId: string; method: string };

	// Credit Events
	credits_checked: { balance: number };
	credits_insufficient: { required: number; available: number; action: string };
	credits_consumed: { amount: number; action: string; balance: number };
	credits_purchase_initiated: { amount: number };
	credits_purchase_completed: { amount: number; paymentMethod: string };
	credits_purchase_failed: { amount: number; error: string };
	credits_screen_viewed: { source: string; balance: number };
	credits_screen_duration: { duration: number; purchaseMade: boolean };

	// Navigation Events
	screen_viewed: {
		screenName: string;
		params?: Record<string, any>;
		previousScreen?: string;
	};

	// Settings Events
	settings_opened: {};
	settings_language_changed: { from: string; to: string };
	settings_creator_changed: { from: string; to: string };
	settings_theme_changed: { from: string; to: string };

	// Performance Events
	app_started: { coldStart: boolean; duration: number };
	api_request: {
		endpoint: string;
		method: string;
		duration: number;
		statusCode: number;
		success: boolean;
	};
	image_loaded: { url: string; duration: number; cached: boolean };
	image_load_failed: { url: string; error: string };

	// Error Events
	error_occurred: {
		error: string;
		errorCode?: string;
		screen: string;
		action?: string;
		metadata?: Record<string, any>;
	};

	// Feature Discovery
	feature_discovered: { feature: string; source: string };
	tooltip_viewed: { tooltip: string };
	onboarding_step_viewed: { step: number; stepName: string };
	onboarding_completed: { duration: number };
	onboarding_skipped: { step: number };

	// Social Features
	share_initiated: { contentType: 'story' | 'character'; contentId: string };
	share_completed: { contentType: 'story' | 'character'; contentId: string; platform: string };
	share_cancelled: { contentType: 'story' | 'character'; contentId: string };

	// Engagement
	session_started: {};
	session_ended: { duration: number };
	app_backgrounded: { sessionDuration: number };
	app_foregrounded: {};
};

class AnalyticsService {
	private client: PostHog | null = null;
	private initialized = false;
	private sessionStartTime: number | null = null;
	private currentScreen: string | null = null;

	/**
	 * Initialize PostHog client
	 */
	async initialize(): Promise<void> {
		const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
		const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

		if (!apiKey || apiKey === 'your-posthog-api-key') {
			console.warn('[Analytics] PostHog API key not configured. Analytics will be disabled.');
			return;
		}

		try {
			this.client = await PostHog.initAsync(apiKey, {
				host,
				captureApplicationLifecycleEvents: true,
				captureDeepLinks: true,
			});

			// Set super properties (sent with every event)
			await this.setSuperProperties();

			this.initialized = true;
			this.sessionStartTime = Date.now();

			console.log('[Analytics] PostHog initialized successfully');

			// Track app started
			this.track('app_started', {
				coldStart: true,
				duration: 0,
			});
		} catch (error) {
			console.error('[Analytics] Failed to initialize PostHog:', error);
		}
	}

	/**
	 * Set super properties that are sent with every event
	 */
	private async setSuperProperties(): Promise<void> {
		if (!this.client) return;

		const properties = {
			app_version: Constants.expoConfig?.version || 'unknown',
			app_build: Application.nativeBuildVersion || 'unknown',
			platform: Platform.OS,
			device_type: Device.deviceType,
			device_model: Device.modelName || 'unknown',
			os_version: Platform.Version,
			is_device: Device.isDevice,
			brand: Device.brand || 'unknown',
		};

		await this.client.register(properties);
	}

	/**
	 * Identify user with unique ID and properties
	 */
	async identify(userId: string, properties?: Record<string, any>): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.identify(userId, {
				...properties,
				identified_at: new Date().toISOString(),
			});
			console.log('[Analytics] User identified:', userId);
		} catch (error) {
			console.error('[Analytics] Failed to identify user:', error);
		}
	}

	/**
	 * Reset user identity (on logout)
	 */
	async reset(): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.reset();
			console.log('[Analytics] User identity reset');
		} catch (error) {
			console.error('[Analytics] Failed to reset identity:', error);
		}
	}

	/**
	 * Track an analytics event with type safety
	 */
	track<K extends keyof AnalyticsEvent>(event: K, properties?: AnalyticsEvent[K]): void {
		if (!this.client || !this.initialized) {
			console.log('[Analytics] Event not tracked (not initialized):', event);
			return;
		}

		try {
			const enrichedProperties = {
				...properties,
				timestamp: new Date().toISOString(),
				current_screen: this.currentScreen,
				session_duration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
			};

			this.client.capture(event, enrichedProperties);
			console.log('[Analytics] Event tracked:', event, enrichedProperties);
		} catch (error) {
			console.error('[Analytics] Failed to track event:', event, error);
		}
	}

	/**
	 * Track screen view
	 */
	trackScreenView(screenName: string, params?: Record<string, any>): void {
		const previousScreen = this.currentScreen;
		this.currentScreen = screenName;

		this.track('screen_viewed', {
			screenName,
			params,
			previousScreen: previousScreen || undefined,
		});
	}

	/**
	 * Track API request performance
	 */
	trackApiRequest(endpoint: string, method: string, duration: number, statusCode: number): void {
		this.track('api_request', {
			endpoint,
			method,
			duration,
			statusCode,
			success: statusCode >= 200 && statusCode < 300,
		});
	}

	/**
	 * Track error with context
	 */
	trackError(
		error: Error | string,
		context?: {
			screen?: string;
			action?: string;
			metadata?: Record<string, any>;
		}
	): void {
		const errorMessage = error instanceof Error ? error.message : error;
		const errorCode = error instanceof Error ? (error as any).code : undefined;

		this.track('error_occurred', {
			error: errorMessage,
			errorCode,
			screen: context?.screen || this.currentScreen || 'unknown',
			action: context?.action,
			metadata: context?.metadata,
		});
	}

	/**
	 * Set user properties
	 */
	async setUserProperties(properties: Record<string, any>): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.setPersonProperties(properties);
			console.log('[Analytics] User properties set:', properties);
		} catch (error) {
			console.error('[Analytics] Failed to set user properties:', error);
		}
	}

	/**
	 * Track session end
	 */
	trackSessionEnd(): void {
		if (this.sessionStartTime) {
			const duration = Date.now() - this.sessionStartTime;
			this.track('session_ended', { duration });
		}
	}

	/**
	 * Get session duration
	 */
	getSessionDuration(): number {
		return this.sessionStartTime ? Date.now() - this.sessionStartTime : 0;
	}

	/**
	 * Check if analytics is enabled and initialized
	 */
	isEnabled(): boolean {
		return this.initialized && this.client !== null;
	}

	/**
	 * Flush events (send immediately)
	 */
	async flush(): Promise<void> {
		if (!this.client) return;

		try {
			await this.client.flush();
			console.log('[Analytics] Events flushed');
		} catch (error) {
			console.error('[Analytics] Failed to flush events:', error);
		}
	}
}

// Export singleton instance
export const analytics = new AnalyticsService();

// Convenience functions
export const trackEvent = <K extends keyof AnalyticsEvent>(
	event: K,
	properties?: AnalyticsEvent[K]
) => analytics.track(event, properties);

export const trackScreenView = (screenName: string, params?: Record<string, any>) =>
	analytics.trackScreenView(screenName, params);

export const trackError = (
	error: Error | string,
	context?: {
		screen?: string;
		action?: string;
		metadata?: Record<string, any>;
	}
) => analytics.trackError(error, context);

export default analytics;
