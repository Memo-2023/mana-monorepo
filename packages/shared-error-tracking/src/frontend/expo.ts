import type { ErrorTracker } from './error-tracker';

/**
 * Create an Expo/React Native error handler for react-native-error-boundary
 *
 * Usage:
 * ```typescript
 * // App.tsx
 * import ErrorBoundary from 'react-native-error-boundary';
 * import { createExpoErrorHandler } from '@manacore/shared-error-tracking/frontend';
 * import { errorTracker } from '@/lib/error-tracking';
 *
 * const { errorHandler, ErrorFallback } = createExpoErrorHandler(errorTracker);
 *
 * export default function App() {
 *   return (
 *     <ErrorBoundary onError={errorHandler} FallbackComponent={ErrorFallback}>
 *       <RootNavigator />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 */
export function createExpoErrorHandler(errorTracker: ErrorTracker) {
	const errorHandler = (error: Error, stackTrace: string) => {
		void errorTracker.captureError(error, {
			type: 'error_boundary',
			stackTrace,
		});
	};

	return {
		errorHandler,
	};
}

/**
 * Get device info for React Native
 * This is a simple implementation - for more detailed info,
 * consider using react-native-device-info package
 */
export function getReactNativeDeviceInfo(): Record<string, unknown> {
	const info: Record<string, unknown> = {
		platform: 'react-native',
	};

	// Add Platform info if available
	try {
		// Dynamic import to avoid issues in non-RN environments
		const Platform = require('react-native').Platform;
		info.os = Platform.OS;
		info.version = Platform.Version;
		info.isTV = Platform.isTV;
	} catch {
		// Platform not available
	}

	// Add Dimensions if available
	try {
		const Dimensions = require('react-native').Dimensions;
		const { width, height } = Dimensions.get('window');
		info.screenWidth = width;
		info.screenHeight = height;
	} catch {
		// Dimensions not available
	}

	return info;
}

/**
 * Setup global error handler for React Native
 * Call this in your app entry point
 *
 * Usage:
 * ```typescript
 * // index.js or App.tsx
 * import { setupReactNativeErrorHandler } from '@manacore/shared-error-tracking/frontend';
 * import { errorTracker } from '@/lib/error-tracking';
 *
 * setupReactNativeErrorHandler(errorTracker);
 * ```
 */
export function setupReactNativeErrorHandler(errorTracker: ErrorTracker): void {
	// Override the default error handler
	const originalHandler = ErrorUtils.getGlobalHandler();

	ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
		// Capture the error
		void errorTracker.captureError(error, {
			type: 'global_error',
			isFatal,
			deviceInfo: getReactNativeDeviceInfo(),
		});

		// Call the original handler
		if (originalHandler) {
			originalHandler(error, isFatal);
		}
	});
}

// Type declaration for React Native's ErrorUtils
declare const ErrorUtils: {
	getGlobalHandler: () => ((error: Error, isFatal?: boolean) => void) | undefined;
	setGlobalHandler: (handler: (error: Error, isFatal?: boolean) => void) => void;
};
