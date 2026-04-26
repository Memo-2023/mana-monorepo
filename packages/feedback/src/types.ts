/**
 * Configuration for creating a feedback service instance.
 */
export interface FeedbackServiceConfig {
	/** Base API URL for the feedback endpoints (e.g. https://analytics.mana.how). */
	apiUrl: string;
	/** App identifier used for filtering + per-app context. */
	appId: string;
	/**
	 * Function returning the current Bearer token. Required for write
	 * paths (createFeedback, react). For read-only public consumption
	 * use `createPublicFeedbackService()` instead.
	 */
	getAuthToken: () => Promise<string | null>;
	/** Optional custom endpoint prefix (default: '/api/v1/feedback'). */
	feedbackEndpoint?: string;
	/** Optional public-endpoint prefix (default: '/api/v1/public/feedback'). */
	publicEndpoint?: string;
}

/**
 * Configuration for the read-only, anonymous public feedback service —
 * used by SSR pages that don't have a logged-in user and just need to
 * render the community feed.
 */
export interface PublicFeedbackServiceConfig {
	apiUrl: string;
	appId?: string;
	publicEndpoint?: string;
}
