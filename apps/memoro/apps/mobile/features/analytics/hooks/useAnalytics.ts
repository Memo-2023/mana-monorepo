import { useCallback } from 'react';
import { multiPlatformAnalytics } from '../services/multiPlatformAnalytics';
import type { AnalyticsProperties, UserProperties } from '../types';

export const useAnalytics = () => {
	const track = useCallback((event: string, properties?: AnalyticsProperties) => {
		multiPlatformAnalytics.track(event, properties);
	}, []);

	const identify = useCallback((userId: string, properties?: UserProperties) => {
		multiPlatformAnalytics.identify(userId, properties);
	}, []);

	const screen = useCallback((screenName: string, properties?: AnalyticsProperties) => {
		multiPlatformAnalytics.screen(screenName, properties);
	}, []);

	const reset = useCallback(() => {
		multiPlatformAnalytics.reset();
	}, []);

	return {
		track,
		identify,
		screen,
		reset,
	};
};
