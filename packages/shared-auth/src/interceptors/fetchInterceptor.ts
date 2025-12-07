import type { TokenManager } from '../core/tokenManager';
import type { AuthService } from '../core/authService';
import { TokenState } from '../types';

/**
 * Configuration for the fetch interceptor
 */
export interface FetchInterceptorConfig {
	/**
	 * Patterns to skip (won't be intercepted)
	 */
	skipPatterns?: string[];
	/**
	 * Backend URL to match (only intercept requests to this URL)
	 */
	backendUrl?: string;
}

/**
 * Default patterns to skip
 */
const DEFAULT_SKIP_PATTERNS = [
	// Auth endpoints (Mana Core Auth)
	'/api/v1/auth/login',
	'/api/v1/auth/register',
	'/api/v1/auth/refresh',
	'/api/v1/auth/logout',
	'/api/v1/auth/forgot-password',
	'/api/v1/auth/reset-password',
	'/api/v1/auth/verify',
	'/api/v1/auth/google-signin',
	'/api/v1/auth/apple-signin',
	// Legacy auth patterns (for backwards compatibility)
	'/auth/signin',
	'/auth/signup',
	'/auth/refresh',
	'/auth/forgot-password',
	'/auth/reset-password',
	'/auth/verify',
	'/auth/logout',
	// Public endpoints
	'/health',
	'/ping',
	'/status',
	'/version',
	'/public/',
	// Storage endpoints
	'.supabase.co/storage/',
	'/storage/v1/',
	// External APIs
	'googleapis.com',
	'firebase.com',
	'firebaseapp.com',
	'replicate.com',
	'openai.com',
	'anthropic.com',
];

/**
 * Setup a global fetch interceptor for automatic token handling
 */
export function setupFetchInterceptor(
	authService: AuthService,
	tokenManager: TokenManager,
	config?: FetchInterceptorConfig
): void {
	if (typeof globalThis === 'undefined' || !globalThis.fetch) {
		console.warn('FetchInterceptor: globalThis.fetch not available');
		return;
	}

	const originalFetch = globalThis.fetch;
	const skipPatterns = [...DEFAULT_SKIP_PATTERNS, ...(config?.skipPatterns || [])];
	const backendUrl = config?.backendUrl || authService.getBaseUrl();

	globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = extractUrl(input);

		// Skip intercepting if URL doesn't match criteria
		if (shouldSkipInterception(url, skipPatterns, backendUrl)) {
			return originalFetch(input, init);
		}

		console.debug('Fetch interceptor: Intercepting URL:', url);

		try {
			// Make request with current token
			const response = await makeRequestWithToken(originalFetch, authService, input, init);

			// Handle 401 responses
			if (response.status === 401) {
				const responseData = await response
					.clone()
					.json()
					.catch(() => ({}));
				console.debug('Fetch interceptor: Received 401 response:', responseData);

				if (isTokenExpiredResponse(responseData)) {
					console.debug('Fetch interceptor: Token expired, delegating to TokenManager');
					return tokenManager.handle401Response(input, init);
				}
			}

			return response;
		} catch (error) {
			console.debug('Error in global fetch interceptor:', error);
			return originalFetch(input, init);
		}
	}) as typeof fetch;
}

/**
 * Setup token state observers for integrations (e.g., Supabase)
 */
export function setupTokenObservers(
	tokenManager: TokenManager,
	onValid?: (token: string) => void | Promise<void>,
	onExpired?: () => void | Promise<void>
): () => void {
	return tokenManager.subscribe(async (state, token) => {
		try {
			if (state === TokenState.VALID && token && onValid) {
				await onValid(token);
			} else if (state === TokenState.EXPIRED && onExpired) {
				await onExpired();
			}
		} catch (error) {
			console.debug('Error in token observer:', error);
		}
	});
}

/**
 * Extract URL from various input types
 */
function extractUrl(input: RequestInfo | URL): string {
	if (typeof input === 'string') {
		return input;
	} else if (input instanceof URL) {
		return input.toString();
	} else if (input instanceof Request) {
		return input.url;
	}
	return '';
}

/**
 * Check if request should skip interception
 */
function shouldSkipInterception(url: string, skipPatterns: string[], backendUrl: string): boolean {
	if (!url) return true;

	const lowerUrl = url.toLowerCase();

	// Check skip patterns
	if (skipPatterns.some((pattern) => lowerUrl.includes(pattern.toLowerCase()))) {
		return true;
	}

	// Check if URL matches backend (must include full host:port)
	// Parse backendUrl to get origin (protocol + host + port)
	try {
		const backendOrigin = new URL(backendUrl).origin.toLowerCase();
		const requestOrigin = new URL(url).origin.toLowerCase();

		// Only intercept if request origin matches backend origin
		if (requestOrigin !== backendOrigin) {
			return true;
		}
	} catch {
		// If URL parsing fails, skip interception
		return true;
	}

	return false;
}

/**
 * Make a request with the current token
 */
async function makeRequestWithToken(
	originalFetch: typeof fetch,
	authService: AuthService,
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const token = await authService.getAppToken();

	const requestInit: RequestInit = {
		method: init?.method || 'GET',
		...init,
	};

	if (token) {
		const headers = new Headers(requestInit.headers || {});
		headers.set('Authorization', `Bearer ${token}`);
		requestInit.headers = headers;
	}

	return originalFetch(input, requestInit);
}

/**
 * Check if response indicates token expiration
 * Only return true for explicit token expiration, not generic unauthorized errors
 */
function isTokenExpiredResponse(responseData: Record<string, unknown>): boolean {
	const error = responseData.error as Record<string, unknown> | undefined;
	const errorMessage = String(
		error?.message || responseData.message || responseData.error || ''
	).toLowerCase();
	const errorCode = String(responseData.code || error?.code || '');

	// Only trigger refresh for explicit token expiration messages
	return (
		errorMessage.includes('jwt expired') ||
		errorMessage.includes('token expired') ||
		errorMessage.includes('token has expired') ||
		errorCode === 'PGRST301' ||
		errorCode === 'TOKEN_EXPIRED'
	);
}

/**
 * Get interceptor status for debugging
 */
export function getInterceptorStatus(
	authService: AuthService,
	tokenManager: TokenManager
): {
	isSetup: boolean;
	backendUrl: string;
	tokenManager: { size: number; state: string; refreshAttempts: number };
} {
	return {
		isSetup: typeof globalThis !== 'undefined' && globalThis.fetch !== undefined,
		backendUrl: authService.getBaseUrl(),
		tokenManager: tokenManager.getQueueStatus(),
	};
}
