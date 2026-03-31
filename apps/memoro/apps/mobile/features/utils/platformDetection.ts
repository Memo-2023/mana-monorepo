import { Platform } from 'react-native';

/**
 * Detects if the app is running on macOS (via Mac Catalyst)
 */
export const isMacOS = (): boolean => {
	// Check if running on iOS with Mac Catalyst
	if (Platform.OS === 'ios') {
		// @ts-ignore - isPad and isMacCatalyst are not in TypeScript definitions
		const isPad = Platform.isPad;
		const isMacCatalyst = Platform.isMacCatalyst;

		// Mac Catalyst apps report as iOS but have special properties
		if (isMacCatalyst === true) {
			return true;
		}

		// Additional check: window dimensions on Mac are typically larger
		if (typeof window !== 'undefined' && window.screen) {
			const { width, height } = window.screen;
			// Mac screens are typically much larger than iOS devices
			if (width > 1920 || height > 1080) {
				return true;
			}
		}
	}

	return false;
};

/**
 * @deprecated Zeego handles platform differences internally
 * Kept for backward compatibility, will be removed in future
 */
export const shouldDisableContextMenu = (): boolean => {
	// Zeego handles all platform differences internally
	// This function is deprecated and always returns false
	return false;
};

/**
 * Returns a safe platform string for logging and debugging
 */
export const getPlatformString = (): string => {
	if (isMacOS()) return 'macos';
	if (Platform.OS === 'ios') return 'ios';
	if (Platform.OS === 'android') return 'android';
	return Platform.OS;
};
