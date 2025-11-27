import { authService } from './authService';
import { debug, info, warn, error as logError } from '../utils/logger';

// Token state management
export enum TokenState {
	IDLE = 'idle',
	REFRESHING = 'refreshing',
	EXPIRED = 'expired',
	VALID = 'valid',
}

// Request queue item
interface QueuedRequest {
	id: string;
	input: RequestInfo | URL;
	init?: RequestInit;
	resolve: (value: Response) => void;
	reject: (reason?: unknown) => void;
	timestamp: number;
}

// Token refresh result
interface TokenRefreshResult {
	success: boolean;
	token?: string;
	error?: string;
}

// Observer for token state changes
type TokenStateObserver = (state: TokenState, token?: string) => void;

/**
 * Centralized token manager to handle all authentication token operations
 * and eliminate race conditions in token refresh
 */
class TokenManager {
	private state: TokenState = TokenState.IDLE;
	private refreshPromise: Promise<TokenRefreshResult> | null = null;
	private requestQueue: QueuedRequest[] = [];
	private observers: Set<TokenStateObserver> = new Set();

	// Configuration
	private readonly MAX_QUEUE_SIZE = 50;
	private readonly QUEUE_TIMEOUT_MS = 30000; // 30 seconds
	private readonly MAX_REFRESH_ATTEMPTS = 3;
	private refreshAttempts = 0;
	private lastRefreshTime = 0;
	private readonly REFRESH_COOLDOWN_MS = 5000; // 5 second cooldown

	private static instance: TokenManager;

	private constructor() {
		// Start with initial state check
		this.checkInitialState();
	}

	static getInstance(): TokenManager {
		if (!TokenManager.instance) {
			TokenManager.instance = new TokenManager();
		}
		return TokenManager.instance;
	}

	/**
	 * Subscribe to token state changes
	 */
	subscribe(observer: TokenStateObserver): () => void {
		this.observers.add(observer);
		return () => this.observers.delete(observer);
	}

	/**
	 * Notify all observers of state changes
	 */
	private notifyObservers(state: TokenState, token?: string): void {
		this.observers.forEach((observer) => {
			try {
				observer(state, token);
			} catch (err) {
				debug('Error in token state observer:', err);
			}
		});
	}

	/**
	 * Set the current token state
	 */
	private setState(newState: TokenState, token?: string): void {
		if (this.state !== newState) {
			debug(`TokenManager: State transition ${this.state} -> ${newState}`);
			this.state = newState;
			this.notifyObservers(newState, token);
		}
	}

	/**
	 * Get current token state
	 */
	getState(): TokenState {
		return this.state;
	}

	/**
	 * Check initial token state on startup
	 */
	private async checkInitialState(): Promise<void> {
		try {
			const token = await authService.getAppToken();
			if (!token) {
				this.setState(TokenState.EXPIRED);
				return;
			}

			if (authService.isTokenValidLocally(token)) {
				this.setState(TokenState.VALID, token);
			} else {
				this.setState(TokenState.EXPIRED);
			}
		} catch (error) {
			debug('Error checking initial token state:', error);
			this.setState(TokenState.EXPIRED);
		}
	}

	/**
	 * Get a valid token, refreshing if necessary
	 */
	async getValidToken(): Promise<string | null> {
		const currentToken = await authService.getAppToken();

		if (currentToken && authService.isTokenValidLocally(currentToken)) {
			this.setState(TokenState.VALID, currentToken);
			return currentToken;
		}

		// If there's no token at all (fresh install), don't attempt refresh
		if (!currentToken) {
			debug('TokenManager: No token available, skipping refresh (fresh install)');
			this.setState(TokenState.EXPIRED);
			return null;
		}

		// Token is expired or invalid, attempt refresh
		debug('TokenManager: Current token invalid, attempting refresh...');
		const refreshResult = await this.refreshToken();

		if (refreshResult.success && refreshResult.token) {
			debug('TokenManager: Token refresh successful in getValidToken');
			return refreshResult.token;
		} else {
			debug('TokenManager: Token refresh failed in getValidToken:', refreshResult.error);
			return null;
		}
	}

	/**
	 * Handle 401 response by either refreshing token or queueing request
	 */
	async handle401Response(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		// Check if we're already refreshing
		if (this.state === TokenState.REFRESHING && this.refreshPromise) {
			return this.queueRequest(input, init);
		}

		// Start token refresh
		const refreshResult = await this.refreshToken();

		if (refreshResult.success && refreshResult.token) {
			// Retry the request with new token
			return this.retryRequestWithToken(input, init, refreshResult.token);
		} else {
			// Check if we're offline before throwing error
			if (refreshResult.error === 'offline') {
				debug('TokenManager: Offline during 401 handling, throwing network error');
				throw new Error('Network request failed: Device offline');
			}
			// Refresh failed, propagate error
			throw new Error(refreshResult.error || 'Token refresh failed');
		}
	}

	/**
	 * Queue a request during token refresh
	 */
	private async queueRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
		return new Promise((resolve, reject) => {
			// Check queue size limit
			if (this.requestQueue.length >= this.MAX_QUEUE_SIZE) {
				reject(new Error('Request queue full'));
				return;
			}

			const queueItem: QueuedRequest = {
				id: Math.random().toString(36).substring(2, 11),
				input,
				init,
				resolve,
				reject,
				timestamp: Date.now(),
			};

			this.requestQueue.push(queueItem);

			// Set timeout for queued request
			setTimeout(() => {
				this.removeFromQueue(queueItem.id);
				reject(new Error('Queued request timeout'));
			}, this.QUEUE_TIMEOUT_MS);

			debug(
				`TokenManager: Queued request ${queueItem.id}, queue size: ${this.requestQueue.length}`
			);
		});
	}

	/**
	 * Remove request from queue by ID
	 */
	private removeFromQueue(requestId: string): void {
		const index = this.requestQueue.findIndex((item) => item.id === requestId);
		if (index !== -1) {
			this.requestQueue.splice(index, 1);
		}
	}

	/**
	 * Refresh the authentication token with progressive backoff retry logic
	 */
	private async refreshToken(): Promise<TokenRefreshResult> {
		// Check cooldown to prevent rapid successive refresh attempts
		const now = Date.now();
		if (now - this.lastRefreshTime < this.REFRESH_COOLDOWN_MS) {
			debug('TokenManager: Refresh cooldown active, skipping refresh');
			return { success: false, error: 'Refresh cooldown active' };
		}

		// Check max attempts
		if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
			debug('TokenManager: Max refresh attempts reached');
			await this.handleRefreshFailure();
			return { success: false, error: 'Max refresh attempts reached' };
		}

		// If already refreshing, wait for existing promise
		if (this.refreshPromise) {
			debug('TokenManager: Waiting for existing refresh to complete');
			return await this.refreshPromise;
		}

		this.setState(TokenState.REFRESHING);
		this.lastRefreshTime = now;

		// Use enhanced refresh with retry logic
		this.refreshPromise = this.performTokenRefreshWithRetry();

		try {
			const result = await this.refreshPromise;

			if (result.success) {
				this.refreshAttempts = 0; // Reset on success
				this.setState(TokenState.VALID, result.token);
				await this.processQueuedRequests(result.token!);
			} else {
				this.refreshAttempts++;
				this.setState(TokenState.EXPIRED);
				await this.rejectQueuedRequests(result.error || 'Token refresh failed');
			}

			return result;
		} finally {
			this.refreshPromise = null;
		}
	}

	/**
	 * Enhanced token refresh with progressive backoff for network issues
	 */
	private async performTokenRefreshWithRetry(): Promise<TokenRefreshResult> {
		const retryDelays = [0, 1000, 2000, 5000]; // Progressive backoff: 0ms, 1s, 2s, 5s
		let lastError: unknown = null;

		for (let attempt = 0; attempt < retryDelays.length; attempt++) {
			try {
				// Wait for retry delay (except first attempt)
				if (retryDelays[attempt] > 0) {
					debug(
						`TokenManager: Retrying token refresh in ${retryDelays[attempt]}ms (attempt ${attempt + 1}/${retryDelays.length})`
					);
					await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
				}

				const result = await this.performTokenRefresh();

				if (result.success) {
					if (attempt > 0) {
						debug(`TokenManager: Token refresh succeeded on attempt ${attempt + 1}`);
					}
					return result;
				}

				// Handle specific server-side errors that shouldn't be retried
				if (
					result.error === 'invalid_token' ||
					result.error === 'token_expired' ||
					result.error === 'invalid_token_state' ||
					result.error === 'token_collision' ||
					(result.error && result.error.includes('Device ID has changed'))
				) {
					debug('TokenManager: Non-retryable error:', result.error);
					return result; // Don't retry permanent auth errors
				}

				// Handle offline state - don't count as failure
				if (result.error === 'offline') {
					debug('TokenManager: Device offline, preserving auth state');
					return { success: false, error: 'offline' }; // Return without clearing tokens
				}

				// Handle unstable connection - should retry with longer delay
				if (result.error === 'unstable_connection') {
					debug('TokenManager: Connection unstable, will retry with longer delay');
					// Use a longer delay for unstable connections
					await new Promise((resolve) => setTimeout(resolve, 2000));
					// Continue to next retry attempt
				}

				// Handle refresh_in_progress or rotation_in_progress with shorter delay
				if (result.error === 'refresh_in_progress' || result.error === 'rotation_in_progress') {
					debug('TokenManager: Token rotation in progress, waiting...');
					await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s for other refresh
					// Try one more time after waiting
					const retryResult = await this.performTokenRefresh();
					if (retryResult.success) {
						return retryResult;
					}
				}

				lastError = new Error(result.error || 'Token refresh failed');

				// If this is the last attempt, return the error
				if (attempt === retryDelays.length - 1) {
					break;
				}
			} catch (error) {
				lastError = error;

				// Check if this is a recoverable network error
				const isRecoverable = this.isRecoverableError(error);

				if (!isRecoverable) {
					debug('TokenManager: Non-recoverable error, stopping retries:', error);
					break; // Don't retry non-network errors
				}

				debug(`TokenManager: Network error on attempt ${attempt + 1}, will retry:`, error);

				// If this is the last attempt, break out
				if (attempt === retryDelays.length - 1) {
					break;
				}
			}
		}

		// All retries failed
		debug('TokenManager: All retry attempts failed');
		return {
			success: false,
			error: lastError instanceof Error ? lastError.message : 'All retry attempts failed',
		};
	}

	/**
	 * Perform the actual token refresh operation
	 */
	private async performTokenRefresh(): Promise<TokenRefreshResult> {
		try {
			debug('TokenManager: Starting token refresh');

			// Check network status first - use stable connection check for critical operations
			const { hasStableConnection, isDeviceConnected } = await import('~/utils/networkErrorUtils');

			// First check basic connectivity
			const isOnline = await isDeviceConnected();

			if (!isOnline) {
				debug('TokenManager: Device offline, skipping refresh');
				// Return success with current token if it's not expired locally
				const currentToken = await authService.getAppToken();
				if (currentToken && authService.isTokenValidLocally(currentToken)) {
					return { success: true, token: currentToken };
				}
				return { success: false, error: 'offline' };
			}

			// For token refresh, ensure we have a stable connection
			const isStable = await hasStableConnection();
			if (!isStable) {
				debug('TokenManager: Connection not stable yet, will retry');
				// Return a specific error that indicates we should retry
				return { success: false, error: 'unstable_connection' };
			}

			const refreshToken = await authService.getRefreshToken();
			if (!refreshToken) {
				throw new Error('No refresh token available');
			}

			const refreshResult = await authService.refreshTokens(refreshToken);
			const { appToken, refreshToken: newRefreshToken, userData } = refreshResult;

			if (!appToken || !newRefreshToken) {
				throw new Error('Invalid tokens received from refresh');
			}

			// Note: authService.refreshTokens() already saves tokens to storage
			// No need to call updateTokens() again - this was causing race conditions

			// If we have user data from the refresh, notify via the callback
			if (userData && authService.onTokenRefresh) {
				debug('TokenManager: Notifying auth context with fresh user data');
				authService.onTokenRefresh(userData);
			}

			debug('TokenManager: Token refresh successful');
			return { success: true, token: appToken };
		} catch (error) {
			debug('TokenManager: Token refresh failed:', error);

			// Determine if this is a recoverable error
			const isRecoverable = this.isRecoverableError(error);

			if (!isRecoverable) {
				await this.handleRefreshFailure();
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown refresh error',
			};
		}
	}

	/**
	 * Check if an error is recoverable (network issues vs auth failures)
	 */
	private isRecoverableError(error: unknown): boolean {
		if (!(error instanceof Error)) return false;

		const networkErrors = [
			'network',
			'Network',
			'fetch',
			'connection',
			'timeout',
			'Failed to fetch',
			'NetworkError',
			'TypeError',
			'ERR_NETWORK',
			'ERR_INTERNET_DISCONNECTED',
			'ECONNREFUSED',
			'ENOTFOUND',
			'ETIMEDOUT',
			'Unable to resolve host',
			'Request failed',
		];

		const authErrors = [
			'401',
			'403',
			'Unauthorized',
			'Forbidden',
			'Invalid token',
			'Token expired',
			'jwt expired',
			'jwt malformed',
		];

		const errorString = `${error.message} ${error.name}`.toLowerCase();

		const isNetworkError = networkErrors.some((keyword) =>
			errorString.includes(keyword.toLowerCase())
		);

		const isAuthError = authErrors.some((keyword) => errorString.includes(keyword.toLowerCase()));

		// Network errors are recoverable unless they also contain auth errors
		return isNetworkError && !isAuthError;
	}

	/**
	 * Handle permanent refresh failure
	 */
	private async handleRefreshFailure(): Promise<void> {
		debug('TokenManager: Handling permanent refresh failure');

		try {
			await authService.clearAuthStorage();
			this.setState(TokenState.EXPIRED);

			// Don't automatically redirect here - let the AuthContext handle logout
			// The AuthContext will handle the logout flow properly
		} catch (error) {
			debug('Error in handleRefreshFailure:', error);
		}
	}

	/**
	 * Check if we should attempt token refresh (has valid refresh token)
	 */
	async canAttemptRefresh(): Promise<boolean> {
		try {
			const refreshToken = await authService.getRefreshToken();
			return !!refreshToken;
		} catch (error) {
			debug('Error checking refresh token availability:', error);
			return false;
		}
	}

	/**
	 * Process all queued requests with the new token
	 */
	private async processQueuedRequests(token: string): Promise<void> {
		debug(`TokenManager: Processing ${this.requestQueue.length} queued requests`);

		const requests = [...this.requestQueue];
		this.requestQueue = [];

		for (const request of requests) {
			try {
				const response = await this.retryRequestWithToken(request.input, request.init, token);
				request.resolve(response);
			} catch (error) {
				request.reject(error);
			}
		}
	}

	/**
	 * Reject all queued requests with error
	 */
	private async rejectQueuedRequests(error: string): Promise<void> {
		debug(`TokenManager: Rejecting ${this.requestQueue.length} queued requests`);

		const requests = [...this.requestQueue];
		this.requestQueue = [];

		for (const request of requests) {
			request.reject(new Error(error));
		}
	}

	/**
	 * Retry a request with a new token
	 */
	private async retryRequestWithToken(
		input: RequestInfo | URL,
		init: RequestInit | undefined,
		token: string
	): Promise<Response> {
		const headers = new Headers(init?.headers || {});
		headers.set('Authorization', `Bearer ${token}`);

		return fetch(input, {
			...init,
			headers,
		});
	}

	/**
	 * Reset the token manager state (for testing or logout)
	 */
	reset(): void {
		this.state = TokenState.IDLE;
		this.refreshPromise = null;
		this.refreshAttempts = 0;
		this.lastRefreshTime = 0;

		// Reject all queued requests
		const requests = [...this.requestQueue];
		this.requestQueue = [];

		for (const request of requests) {
			request.reject(new Error('Token manager reset'));
		}

		debug('TokenManager: Reset completed');
	}

	/**
	 * Clear tokens and reset state (for logout)
	 */
	async clearTokens(): Promise<void> {
		try {
			await authService.clearAuthStorage();
			// Skip EXPIRED state transition during logout to prevent observer loops
			// Go directly to reset which sets IDLE state
			this.reset();
		} catch (error) {
			debug('Error clearing tokens:', error);
			// On error, still reset to ensure clean state
			this.reset();
		}
	}

	/**
	 * Get queue status for debugging
	 */
	getQueueStatus(): { size: number; state: TokenState; refreshAttempts: number } {
		return {
			size: this.requestQueue.length,
			state: this.state,
			refreshAttempts: this.refreshAttempts,
		};
	}
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
export default tokenManager;
