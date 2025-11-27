import { Platform } from 'react-native';
import { storage } from './storage';
import { tokenManager } from '../services/tokenManager';
import { parseApiError, isInsufficientCreditsError } from '../../types/errors';
import type { ApiError } from '../components/ErrorAlert';

// Configuration - Update these for production
// For iOS physical device: Replace localhost with your machine's IP address
// For iOS simulator: Use localhost or 127.0.0.1
const getApiBaseUrl = () => {
	const envUrl =
		process.env.EXPO_PUBLIC_STORYTELLER_BACKEND_URL ||
		'https://storyteller-backend-pduya7fsoq-ey.a.run.app';

	if (envUrl) {
		return envUrl;
	}

	// Default to localhost for development
	if (Platform.OS === 'ios') {
		// iOS simulator can use localhost
		return 'http://localhost:3002';
	} else if (Platform.OS === 'android') {
		// Android emulator needs special IP
		return 'http://10.0.2.2:3002';
	}

	return 'http://localhost:3002';
};

export const API_BASE_URL = getApiBaseUrl();

// Secure storage helpers
const getSecureItem = async (key: string): Promise<string | null> => {
	return await storage.getItem(key);
};

const setSecureItem = async (key: string, value: string) => {
	await storage.setItem(key, value);
};

// Device info helper for token refresh
const getDeviceInfo = async () => {
	let deviceId = await getSecureItem('deviceId');
	if (!deviceId) {
		deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
		await setSecureItem('deviceId', deviceId);
	}

	const deviceName =
		Platform.OS === 'web'
			? `Web Browser on ${navigator.userAgent.includes('Mac') ? 'Mac' : navigator.userAgent.includes('Windows') ? 'Windows' : 'Unknown Platform'}`
			: Platform.OS === 'ios'
				? 'iOS Device'
				: 'Android Device';

	const userAgent =
		Platform.OS === 'web'
			? navigator.userAgent
			: `Storyteller/1.0 (${Platform.OS}; ${Platform.Version || 'Unknown'})`;

	const deviceType: 'ios' | 'android' | 'web' =
		Platform.OS === 'web' ? 'web' : Platform.OS === 'ios' ? 'ios' : 'android';

	return {
		deviceId,
		deviceName,
		deviceType,
		userAgent,
	};
};

// Helper function to implement retry logic with delay
async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to check if error is retryable
function isRetryableError(status: number, errorData?: any): boolean {
	// Retry on rate limits, network errors, and server errors
	if (status === 429 || status === 503 || status === 502 || status === 504) {
		return true;
	}

	// Check if backend says it's retryable
	if (errorData && errorData.retryable === true) {
		return true;
	}

	return false;
}

// Authenticated fetch function following mana integration guide with retry logic
export async function fetchWithAuth(
	endpoint: string,
	options: RequestInit = {},
	retryCount = 0,
	maxRetries = 2
) {
	// Use tokenManager to get a valid token (handles refresh automatically)
	let appToken = await tokenManager.getValidToken();

	if (!appToken) {
		console.error('fetchWithAuth: No valid token available');
		throw new Error('Not authenticated');
	}

	// Add token to request
	const authenticatedOptions: RequestInit = {
		method: options.method || 'GET', // Ensure method is always defined
		...options,
		headers: {
			...options.headers,
			Authorization: `Bearer ${appToken}`,
			'Content-Type': 'application/json',
		},
	};

	// Only set Content-Type to application/json if we're not sending FormData
	if (options.body instanceof FormData) {
		delete (authenticatedOptions.headers as any)['Content-Type'];
	}

	// Remove trailing slash from base URL and leading slash from endpoint to avoid double slashes
	const baseUrl = API_BASE_URL.replace(/\/+$/, '');
	const cleanEndpoint = endpoint.replace(/^\/+/, '');
	const url = `${baseUrl}/${cleanEndpoint}`;

	let response = await fetch(url, authenticatedOptions);

	// Handle token expiration with automatic refresh
	if (response.status === 401) {
		try {
			// Let tokenManager handle the 401 and retry
			response = await tokenManager.handle401Response(url, authenticatedOptions);
		} catch (error) {
			console.error('Token refresh failed:', error);
			// Redirect to login would be handled by the calling component
			throw new Error('Authentication failed. Please login again.');
		}
	}

	if (!response.ok) {
		// Try to parse structured error (including credit errors and user-friendly messages)
		let errorData: any;

		try {
			// Clone response to avoid consuming it
			const responseClone = response.clone();
			errorData = await responseClone.json();
		} catch (jsonError) {
			console.error('Failed to parse error response as JSON:', jsonError);
			// Fallback to generic error
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		// Handle insufficient credits error (special case)
		if (isInsufficientCreditsError(errorData)) {
			const error = new Error(errorData.message) as any;
			error.insufficientCredits = true;
			error.requiredCredits = errorData.requiredCredits;
			error.availableCredits = errorData.availableCredits;
			throw error;
		}

		// Check if we should retry this error
		if (isRetryableError(response.status, errorData) && retryCount < maxRetries) {
			await sleep(1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
			return fetchWithAuth(endpoint, options, retryCount + 1, maxRetries);
		}

		// Build structured error with user-friendly messages
		const apiError: ApiError & Error = Object.assign(
			new Error(errorData.message || `API error: ${response.status}`),
			{
				name: 'ApiError',
				error: errorData.error || errorData.statusCode?.toString(),
				messageDE: errorData.messageDE,
				messageEN: errorData.messageEN,
				retryable: errorData.retryable,
				technicalMessage: errorData.technicalMessage || errorData.message,
			}
		);

		throw apiError;
	}

	return response;
}

// Helper function to check if an error is a credit error
export function isCreditError(error: any): error is Error & {
	insufficientCredits: true;
	requiredCredits: number;
	availableCredits: number;
} {
	return (
		error instanceof Error &&
		(error as any).insufficientCredits === true &&
		typeof (error as any).requiredCredits === 'number' &&
		typeof (error as any).availableCredits === 'number'
	);
}

// Helper function for making API calls to storyteller backend
export const callStoryteller = async (endpoint: string, method: string = 'GET', body?: any) => {
	const options: RequestInit = {
		method,
		body: body ? JSON.stringify(body) : undefined,
	};

	const response = await fetchWithAuth(endpoint, options);

	// Parse JSON response
	const contentType = response.headers.get('content-type');
	if (contentType && contentType.includes('application/json')) {
		return response.json();
	}

	return response.text();
};
