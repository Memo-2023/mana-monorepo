/**
 * Configuration for creating a feedback service instance
 */
export interface FeedbackServiceConfig {
	/** Base API URL for the feedback endpoints */
	apiUrl: string;
	/** App identifier for multi-app support */
	appId: string;
	/** Function to get the current auth token */
	getAuthToken: () => Promise<string | null>;
	/** Optional custom endpoint prefix (default: '/api/v1/feedback') */
	feedbackEndpoint?: string;
}
