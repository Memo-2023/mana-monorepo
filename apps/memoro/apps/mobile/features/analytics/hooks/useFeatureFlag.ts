/**
 * Hook to check if a feature flag is enabled
 * Note: PostHog has been removed, so this always returns false
 * This hook is kept for backward compatibility
 *
 * @param flagKey - The feature flag key to check
 * @returns boolean indicating if the feature is enabled (always false)
 *
 * @example
 * const showNewFeature = useFeatureFlag('new-recording-ui');
 * if (showNewFeature) {
 *   return <NewRecordingUI />;
 * }
 */
export const useFeatureFlag = (_flagKey: string): boolean => {
	// PostHog removed - feature flags disabled
	return false;
};

/**
 * Hook to get all feature flags
 * Note: PostHog has been removed, so this always returns empty object
 * This hook is kept for backward compatibility
 *
 * @returns Record of all feature flags (always empty)
 */
export const useFeatureFlags = (): Record<string, boolean> => {
	// PostHog removed - feature flags disabled
	return {};
};
