/**
 * React hook for tracking story engagement metrics
 *
 * Tracks:
 * - Story session (start/end)
 * - Page viewing time
 * - Story completion
 * - Abandonment
 */

import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../src/services/analytics';
import { AppState, AppStateStatus } from 'react-native';

interface UseStoryEngagementOptions {
	storyId: string;
	title: string;
	pageCount: number;
	enabled?: boolean; // Only track when story is loaded
}

export function useStoryEngagement({
	storyId,
	title,
	pageCount,
	enabled = true,
}: UseStoryEngagementOptions) {
	// Session tracking
	const sessionStartTime = useRef<number>(0);
	const currentPage = useRef<number>(0);
	const pageStartTime = useRef<number>(0);
	const pagesViewed = useRef<Set<number>>(new Set());
	const furthestPage = useRef<number>(0);
	const pageDurations = useRef<Map<number, number>>(new Map());
	const hasTrackedCompletion = useRef<boolean>(false);
	const hasStartedSession = useRef<boolean>(false);
	const appState = useRef<AppStateStatus>(AppState.currentState);

	// Handle app state changes (backgrounding)
	const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
		if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
			// App going to background - track current page duration
			if (hasStartedSession.current && pageStartTime.current > 0) {
				const duration = Date.now() - pageStartTime.current;
				const page = currentPage.current;
				const existingDuration = pageDurations.current.get(page) || 0;
				pageDurations.current.set(page, existingDuration + duration);
			}
		} else if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
			// App coming back to foreground - reset page start time
			if (hasStartedSession.current) {
				pageStartTime.current = Date.now();
			}
		}

		appState.current = nextAppState;
	}, []);

	// Track session start when enabled
	useEffect(() => {
		// Only start tracking if enabled and not already started
		if (!enabled || hasStartedSession.current || pageCount === 0) {
			return;
		}

		hasStartedSession.current = true;
		sessionStartTime.current = Date.now();
		pageStartTime.current = Date.now();

		analytics.track('story_session_started', {
			storyId,
			title,
			pageCount,
		});

		console.log('[StoryEngagement] Session started:', storyId);

		// Handle app state changes (backgrounding)
		const subscription = AppState.addEventListener('change', handleAppStateChange);

		// Cleanup on unmount
		return () => {
			// Only track session end if session was actually started
			if (hasStartedSession.current) {
				trackSessionEnd();
			}
			subscription?.remove();
		};
	}, [enabled, pageCount, storyId, title, handleAppStateChange, trackSessionEnd]);

	const trackCurrentPageDuration = useCallback(() => {
		// Don't track if session hasn't started
		if (!hasStartedSession.current || pageStartTime.current === 0) {
			return;
		}

		const duration = Date.now() - pageStartTime.current;
		const page = currentPage.current;

		// Store duration for this page
		const existingDuration = pageDurations.current.get(page) || 0;
		pageDurations.current.set(page, existingDuration + duration);

		// Track page duration event
		analytics.track('story_page_duration', {
			storyId,
			pageNumber: page,
			duration,
			isStartScreen: page === 0,
			isEndScreen: page === pageCount + 1,
		});

		console.log(`[StoryEngagement] Page ${page} viewed for ${duration}ms`);
	}, [storyId, pageCount]);

	const trackSessionEnd = useCallback(() => {
		// Don't track if session hasn't started
		if (!hasStartedSession.current || sessionStartTime.current === 0) {
			return;
		}

		// Track final page duration
		trackCurrentPageDuration();

		const totalDuration = Date.now() - sessionStartTime.current;
		const completed = hasTrackedCompletion.current;
		const viewedPagesCount = pagesViewed.current.size;

		// Track session ended
		analytics.track('story_session_ended', {
			storyId,
			duration: totalDuration,
			pagesViewed: viewedPagesCount,
			completed,
			furthestPage: furthestPage.current,
		});

		// Track abandonment if not completed
		if (!completed && furthestPage.current > 0) {
			const completionPercentage = (furthestPage.current / pageCount) * 100;

			analytics.track('story_abandoned', {
				storyId,
				lastPage: furthestPage.current,
				totalPages: pageCount,
				duration: totalDuration,
				completionPercentage,
			});

			console.log(`[StoryEngagement] Story abandoned at page ${furthestPage.current}/${pageCount}`);
		}

		console.log('[StoryEngagement] Session ended:', {
			duration: totalDuration,
			pagesViewed: viewedPagesCount,
			completed,
		});
	}, [storyId, pageCount, trackCurrentPageDuration]);

	const trackPageView = useCallback(
		(pageIndex: number) => {
			// Don't track if session hasn't started
			if (!hasStartedSession.current) {
				return;
			}

			// Track duration of previous page
			if (currentPage.current !== pageIndex) {
				trackCurrentPageDuration();
			}

			// Update current page
			currentPage.current = pageIndex;
			pageStartTime.current = Date.now();
			pagesViewed.current.add(pageIndex);
			furthestPage.current = Math.max(furthestPage.current, pageIndex);

			// Determine page type
			const isStartScreen = pageIndex === 0;
			const isEndScreen = pageIndex === pageCount + 1; // +1 because start screen is index 0

			// Track page viewed
			analytics.track('story_page_viewed', {
				storyId,
				pageNumber: pageIndex,
				totalPages: pageCount,
				isStartScreen,
				isEndScreen,
			});

			// Also track the existing page changed event for backward compatibility
			if (!isStartScreen && !isEndScreen) {
				analytics.track('story_page_changed', {
					storyId,
					pageNumber: pageIndex - 1, // Adjust for start screen offset
					totalPages: pageCount,
				});
			}

			console.log(
				`[StoryEngagement] Page viewed: ${pageIndex} (start: ${isStartScreen}, end: ${isEndScreen})`
			);

			// Track completion when reaching end screen
			if (isEndScreen && !hasTrackedCompletion.current) {
				trackCompletion();
			}
		},
		[storyId, pageCount, trackCurrentPageDuration]
	);

	const trackCompletion = useCallback(() => {
		// Don't track if session hasn't started or already tracked
		if (!hasStartedSession.current || hasTrackedCompletion.current) {
			return;
		}

		hasTrackedCompletion.current = true;
		const totalDuration = Date.now() - sessionStartTime.current;

		// Calculate average page duration (excluding start/end screens)
		let totalPageDuration = 0;
		let pageCount = 0;

		pageDurations.current.forEach((duration, page) => {
			if (page !== 0 && page !== pageCount + 1) {
				totalPageDuration += duration;
				pageCount++;
			}
		});

		const averagePageDuration = pageCount > 0 ? totalPageDuration / pageCount : 0;

		analytics.track('story_completed', {
			storyId,
			totalDuration,
			pageCount: pagesViewed.current.size - 2, // Exclude start/end screens
			averagePageDuration,
		});

		console.log('[StoryEngagement] Story completed!', {
			totalDuration,
			averagePageDuration,
			pagesViewed: pagesViewed.current.size,
		});
	}, [storyId]);

	const trackRestart = useCallback(
		(fromPage: number) => {
			// Don't track if session hasn't started
			if (!hasStartedSession.current) {
				return;
			}

			analytics.track('story_restarted', {
				storyId,
				fromPage,
			});

			// Reset tracking
			currentPage.current = 0;
			pageStartTime.current = Date.now();
			hasTrackedCompletion.current = false;

			console.log(`[StoryEngagement] Story restarted from page ${fromPage}`);
		},
		[storyId]
	);

	return {
		trackPageView,
		trackRestart,
		trackCompletion,
	};
}

/**
 * Hook for tracking time spent on credits/mana screen
 */
export function useCreditsScreenTracking(source: string, balance: number) {
	const startTime = useRef<number>(Date.now());
	const purchaseMade = useRef<boolean>(false);

	useEffect(() => {
		startTime.current = Date.now();

		// Track screen viewed
		analytics.track('credits_screen_viewed', {
			source,
			balance,
		});

		console.log('[CreditsScreen] Viewed from:', source);

		// Track duration on unmount
		return () => {
			const duration = Date.now() - startTime.current;

			analytics.track('credits_screen_duration', {
				duration,
				purchaseMade: purchaseMade.current,
			});

			console.log('[CreditsScreen] Duration:', duration, 'Purchase made:', purchaseMade.current);
		};
	}, [source, balance]);

	const markPurchaseMade = useCallback(() => {
		purchaseMade.current = true;
	}, []);

	return {
		markPurchaseMade,
	};
}

export default useStoryEngagement;
