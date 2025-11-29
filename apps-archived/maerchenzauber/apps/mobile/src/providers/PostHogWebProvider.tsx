import React, { useEffect, useState } from 'react';
import { analytics } from '../services/analytics';
import { ActivityIndicator, View } from 'react-native';

/**
 * PostHog Analytics Provider
 * Initializes PostHog on app start
 */
export function PostHogWebProvider({ children }: { children: React.ReactNode }) {
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		const initAnalytics = async () => {
			try {
				await analytics.initialize();
				setIsInitialized(true);
			} catch (error) {
				console.error('[PostHogWebProvider] Failed to initialize analytics:', error);
				// Still show app even if analytics fails
				setIsInitialized(true);
			}
		};

		initAnalytics();

		// Track app backgrounded/foregrounded
		return () => {
			analytics.trackSessionEnd();
		};
	}, []);

	// Don't block app startup for analytics
	// Show children immediately
	return <>{children}</>;
}
