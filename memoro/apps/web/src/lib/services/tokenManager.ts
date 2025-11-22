/**
 * Token Manager for memoro-web
 * Handles JWT token lifecycle, refresh logic, and request queueing
 * Adapted from memoro_app patterns for SvelteKit
 */

import { authService, type UserData } from './authService';
import { browser } from '$app/environment';

// Token state management
export enum TokenState {
	IDLE = 'idle',
	REFRESHING = 'refreshing',
	EXPIRED = 'expired',
	VALID = 'valid'
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

	// Storage keys
	private readonly STORAGE_KEYS = {
		APP_TOKEN: 'memoro_app_token',
		REFRESH_TOKEN: 'memoro_refresh_token',
		USER_EMAIL: 'memoro_user_email'
	};

	private static instance: TokenManager;

	private constructor() {
		// Only initialize in browser
		if (browser) {
			this.checkInitialState();
		}
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
			} catch (error) {
				console.debug('Error in token state observer:', error);
			}
		});
	}

	/**
	 * Set the current token state
	 */
	private setState(newState: TokenState, token?: string): void {
		if (this.state !== newState) {
			console.debug(`TokenManager: State transition ${this.state} -> ${newState}`);
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
		if (!browser) return;

		try {
			const token = this.getStoredToken();
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
			console.debug('Error checking initial token state:', error);
			this.setState(TokenState.EXPIRED);
		}
	}

	/**
	 * Get stored token from localStorage
	 */
	private getStoredToken(): string | null {
		if (!browser) return null;
		return localStorage.getItem(this.STORAGE_KEYS.APP_TOKEN);
	}

	/**
	 * Get stored refresh token from localStorage
	 */
	private getStoredRefreshToken(): string | null {
		if (!browser) return null;
		return localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
	}

	/**
	 * Store tokens in localStorage
	 */
	private storeTokens(appToken: string, refreshToken: string, email?: string): void {
		if (!browser) return;

		localStorage.setItem(this.STORAGE_KEYS.APP_TOKEN, appToken);
		localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
		if (email) {
			localStorage.setItem(this.STORAGE_KEYS.USER_EMAIL, email);
		}
	}

	/**
	 * Clear tokens from localStorage
	 */
	private clearStoredTokens(): void {
		if (!browser) return;

		localStorage.removeItem(this.STORAGE_KEYS.APP_TOKEN);
		localStorage.removeItem(this.STORAGE_KEYS.REFRESH_TOKEN);
		localStorage.removeItem(this.STORAGE_KEYS.USER_EMAIL);
	}

	/**
	 * Get a valid token, refreshing if necessary
	 */
	async getValidToken(): Promise<string | null> {
		const currentToken = this.getStoredToken();

		if (currentToken && authService.isTokenValidLocally(currentToken)) {
			this.setState(TokenState.VALID, currentToken);
			return currentToken;
		}

		// If there's no token at all, don't attempt refresh
		if (!currentToken) {
			console.debug('TokenManager: No token available, skipping refresh');
			this.setState(TokenState.EXPIRED);
			return null;
		}

		// Token is expired or invalid, attempt refresh
		console.debug('TokenManager: Current token invalid, attempting refresh...');
		const refreshResult = await this.refreshToken();

		if (refreshResult.success && refreshResult.token) {
			console.debug('TokenManager: Token refresh successful in getValidToken');
			return refreshResult.token;
		} else {
			console.debug('TokenManager: Token refresh failed in getValidToken:', refreshResult.error);
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
				timestamp: Date.now()
			};

			this.requestQueue.push(queueItem);

			// Set timeout for queued request
			setTimeout(() => {
				this.removeFromQueue(queueItem.id);
				reject(new Error('Queued request timeout'));
			}, this.QUEUE_TIMEOUT_MS);

			console.debug(
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
			console.debug('TokenManager: Refresh cooldown active, skipping refresh');
			return { success: false, error: 'Refresh cooldown active' };
		}

		// Check max attempts
		if (this.refreshAttempts >= this.MAX_REFRESH_ATTEMPTS) {
			console.debug('TokenManager: Max refresh attempts reached');
			await this.handleRefreshFailure();
			return { success: false, error: 'Max refresh attempts reached' };
		}

		// If already refreshing, wait for existing promise
		if (this.refreshPromise) {
			console.debug('TokenManager: Waiting for existing refresh to complete');
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
					console.debug(
						`TokenManager: Retrying token refresh in ${retryDelays[attempt]}ms (attempt ${attempt + 1}/${retryDelays.length})`
					);
					await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
				}

				const result = await this.performTokenRefresh();

				if (result.success) {
					if (attempt > 0) {
						console.debug(`TokenManager: Token refresh succeeded on attempt ${attempt + 1}`);
					}
					return result;
				}

				// Handle specific server-side errors that shouldn't be retried
				if (
					result.error === 'invalid_token' ||
					result.error === 'token_expired' ||
					result.error === 'invalid_token_state' ||
					result.error === 'token_collision' ||
					result.error?.includes('Device ID has changed')
				) {
					console.debug('TokenManager: Non-retryable error:', result.error);
					return result; // Don't retry permanent auth errors
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
					console.debug('TokenManager: Non-recoverable error, stopping retries:', error);
					break; // Don't retry non-network errors
				}

				console.debug(`TokenManager: Network error on attempt ${attempt + 1}, will retry:`, error);

				// If this is the last attempt, break out
				if (attempt === retryDelays.length - 1) {
					break;
				}
			}
		}

		// All retries failed
		console.debug('TokenManager: All retry attempts failed');
		return {
			success: false,
			error: lastError instanceof Error ? lastError.message : 'All retry attempts failed'
		};
	}

	/**
	 * Perform the actual token refresh operation
	 */
	private async performTokenRefresh(): Promise<TokenRefreshResult> {
		try {
			console.debug('TokenManager: Starting token refresh');

			const refreshToken = this.getStoredRefreshToken();
			if (!refreshToken) {
				throw new Error('No refresh token available');
			}

			const refreshResult = await authService.refreshTokens(refreshToken);
			const { appToken, refreshToken: newRefreshToken, userData } = refreshResult;

			if (!appToken || !newRefreshToken) {
				throw new Error('Invalid tokens received from refresh');
			}

			// Store new tokens
			this.storeTokens(appToken, newRefreshToken, userData?.email);

			console.debug('TokenManager: Token refresh successful');
			return { success: true, token: appToken };
		} catch (error) {
			console.debug('TokenManager: Token refresh failed:', error);

			// Determine if this is a recoverable error
			const isRecoverable = this.isRecoverableError(error);

			if (!isRecoverable) {
				await this.handleRefreshFailure();
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown refresh error'
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
			'ERR_NETWORK'
		];

		const authErrors = [
			'401',
			'403',
			'Unauthorized',
			'Forbidden',
			'Invalid token',
			'Token expired',
			'jwt expired',
			'jwt malformed'
		];

		const errorString = `${error.message} ${error.name}`.toLowerCase();

		const isNetworkError = networkErrors.some((keyword) =>
			errorString.includes(keyword.toLowerCase())
		);

		const isAuthError = authErrors.some((keyword) =>
			errorString.includes(keyword.toLowerCase())
		);

		// Network errors are recoverable unless they also contain auth errors
		return isNetworkError && !isAuthError;
	}

	/**
	 * Handle permanent refresh failure
	 */
	private async handleRefreshFailure(): Promise<void> {
		console.debug('TokenManager: Handling permanent refresh failure');

		try {
			this.clearStoredTokens();
			this.setState(TokenState.EXPIRED);
		} catch (error) {
			console.debug('Error in handleRefreshFailure:', error);
		}
	}

	/**
	 * Check if we should attempt token refresh (has valid refresh token)
	 */
	async canAttemptRefresh(): Promise<boolean> {
		try {
			const refreshToken = this.getStoredRefreshToken();
			return !!refreshToken;
		} catch (error) {
			console.debug('Error checking refresh token availability:', error);
			return false;
		}
	}

	/**
	 * Process all queued requests with the new token
	 */
	private async processQueuedRequests(token: string): Promise<void> {
		console.debug(`TokenManager: Processing ${this.requestQueue.length} queued requests`);

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
		console.debug(`TokenManager: Rejecting ${this.requestQueue.length} queued requests`);

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
			headers
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

		console.debug('TokenManager: Reset completed');
	}

	/**
	 * Clear tokens and reset state (for logout)
	 */
	async clearTokens(): Promise<void> {
		try {
			this.clearStoredTokens();
			this.reset();
		} catch (error) {
			console.debug('Error clearing tokens:', error);
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
			refreshAttempts: this.refreshAttempts
		};
	}
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
export default tokenManager;
