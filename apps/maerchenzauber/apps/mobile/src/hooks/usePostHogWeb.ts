import { analytics } from '../services/analytics';
import { AnalyticsEvent } from '../services/analytics';

/**
 * PostHog hook for component usage
 * Provides access to analytics functions
 */
export function usePostHog() {
	return {
		capture: <K extends keyof AnalyticsEvent>(event: K, properties?: AnalyticsEvent[K]) => {
			analytics.track(event, properties);
		},
		identify: (userId: string, properties?: Record<string, any>) => {
			return analytics.identify(userId, properties);
		},
		reset: () => {
			return analytics.reset();
		},
		screen: (screenName: string, properties?: Record<string, any>) => {
			analytics.trackScreenView(screenName, properties);
		},
		isEnabled: () => {
			return analytics.isEnabled();
		},
	};
}
