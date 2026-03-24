import type {
	TokenState,
	TokenStateObserver,
	QueuedRequest,
	InternalTokenRefreshResult,
} from '../types';
import { TokenState as TokenStateEnum } from '../types';
import { isDeviceConnected, hasStableConnection } from '../adapters/network';
import type { AuthService } from './authService';
import { emitSessionExpired } from '../events/sessionExpired';

/**
 * Configuration for the token manager
 */
export interface TokenManagerConfig {
	maxQueueSize?: number;
	queueTimeoutMs?: number;
	maxRefreshAttempts?: number;
	refreshCooldownMs?: number;
}

/**
 * Create a token manager instance
 */
export function createTokenManager(authService: AuthService, config?: TokenManagerConfig) {
	// Configuration
	const MAX_QUEUE_SIZE = config?.maxQueueSize ?? 50;
	const QUEUE_TIMEOUT_MS = config?.queueTimeoutMs ?? 30000;
	const MAX_REFRESH_ATTEMPTS = config?.maxRefreshAttempts ?? 3;
	const REFRESH_COOLDOWN_MS = config?.refreshCooldownMs ?? 5000;

	// State
	let state: TokenState = TokenStateEnum.IDLE;
	let refreshPromise: Promise<InternalTokenRefreshResult> | null = null;
	let requestQueue: QueuedRequest[] = [];
	const observers = new Set<TokenStateObserver>();
	let refreshAttempts = 0;
	let lastRefreshTime = 0;

	// Internal functions
	function notifyObservers(newState: TokenState, token?: string): void {
		observers.forEach((observer) => {
			try {
				observer(newState, token);
			} catch (error) {
				console.debug('Error in token state observer:', error);
			}
		});
	}

	function setState(newState: TokenState, token?: string): void {
		if (state !== newState) {
			console.debug(`TokenManager: State transition ${state} -> ${newState}`);
			state = newState;
			notifyObservers(newState, token);
		}
	}

	function removeFromQueue(requestId: string): void {
		const index = requestQueue.findIndex((item) => item.id === requestId);
		if (index !== -1) {
			requestQueue.splice(index, 1);
		}
	}

	function isRecoverableError(error: unknown): boolean {
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

		return isNetworkError && !isAuthError;
	}

	async function handleRefreshFailure(): Promise<void> {
		console.debug('TokenManager: Handling permanent refresh failure');
		try {
			await authService.clearAuthStorage();
			setState(TokenStateEnum.EXPIRED);
			emitSessionExpired();
		} catch (error) {
			console.debug('Error in handleRefreshFailure:', error);
		}
	}

	async function performTokenRefresh(): Promise<InternalTokenRefreshResult> {
		try {
			console.debug('TokenManager: Starting token refresh');

			const isOnline = await isDeviceConnected();
			if (!isOnline) {
				console.debug('TokenManager: Device offline, skipping refresh');
				const currentToken = await authService.getAppToken();
				if (currentToken) {
					setState(TokenStateEnum.EXPIRED_OFFLINE, currentToken);
				}
				return { success: false, error: 'offline', shouldPreserveAuth: true };
			}

			const isStable = await hasStableConnection();
			if (!isStable) {
				console.debug('TokenManager: Connection not stable yet, will retry');
				return { success: false, error: 'unstable_connection' };
			}

			const refreshToken = await authService.getRefreshToken();
			if (!refreshToken) {
				throw new Error('No refresh token available');
			}

			const refreshResult = await authService.refreshTokens(refreshToken);
			const { appToken } = refreshResult;

			console.debug('TokenManager: Token refresh successful');
			return { success: true, token: appToken };
		} catch (error) {
			console.debug('TokenManager: Token refresh failed:', error);

			const isRecoverable = isRecoverableError(error);
			if (!isRecoverable) {
				await handleRefreshFailure();
			}

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown refresh error',
			};
		}
	}

	async function performTokenRefreshWithRetry(): Promise<InternalTokenRefreshResult> {
		const retryDelays = [0, 1000, 2000, 5000];
		let lastError: unknown = null;

		for (let attempt = 0; attempt < retryDelays.length; attempt++) {
			try {
				if (retryDelays[attempt] > 0) {
					console.debug(
						`TokenManager: Retrying token refresh in ${retryDelays[attempt]}ms (attempt ${attempt + 1}/${retryDelays.length})`
					);
					await new Promise((resolve) => setTimeout(resolve, retryDelays[attempt]));
				}

				const result = await performTokenRefresh();

				if (result.success) {
					return result;
				}

				// Non-retryable errors
				if (
					result.error === 'invalid_token' ||
					result.error === 'token_expired' ||
					result.error?.includes('Device ID has changed')
				) {
					return result;
				}

				if (result.error === 'offline') {
					return { success: false, error: 'offline', shouldPreserveAuth: true };
				}

				if (result.error === 'unstable_connection') {
					await new Promise((resolve) => setTimeout(resolve, 2000));
				}

				lastError = new Error(result.error || 'Token refresh failed');

				if (attempt === retryDelays.length - 1) break;
			} catch (error) {
				lastError = error;
				const isRecoverable = isRecoverableError(error);

				if (!isRecoverable || attempt === retryDelays.length - 1) {
					break;
				}
			}
		}

		return {
			success: false,
			error: lastError instanceof Error ? lastError.message : 'All retry attempts failed',
		};
	}

	async function processQueuedRequests(token: string): Promise<void> {
		console.debug(`TokenManager: Processing ${requestQueue.length} queued requests`);

		const requests = [...requestQueue];
		requestQueue = [];

		for (const request of requests) {
			try {
				const response = await retryRequestWithToken(request.input, request.init, token);
				request.resolve(response);
			} catch (error) {
				request.reject(error);
			}
		}
	}

	async function rejectQueuedRequests(error: string): Promise<void> {
		console.debug(`TokenManager: Rejecting ${requestQueue.length} queued requests`);

		const requests = [...requestQueue];
		requestQueue = [];

		for (const request of requests) {
			request.reject(new Error(error));
		}
	}

	async function retryRequestWithToken(
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

	// Public API
	const manager = {
		/**
		 * Subscribe to token state changes
		 */
		subscribe(observer: TokenStateObserver): () => void {
			observers.add(observer);
			return () => observers.delete(observer);
		},

		/**
		 * Get current token state
		 */
		getState(): TokenState {
			return state;
		},

		/**
		 * Get a valid token, refreshing if necessary
		 */
		async getValidToken(): Promise<string | null> {
			const currentToken = await authService.getAppToken();

			if (currentToken && authService.isTokenValidLocally(currentToken)) {
				setState(TokenStateEnum.VALID, currentToken);
				return currentToken;
			}

			if (!currentToken) {
				console.debug('TokenManager: No token available, skipping refresh');
				setState(TokenStateEnum.EXPIRED);
				return null;
			}

			const isOnline = await isDeviceConnected();
			if (!isOnline) {
				console.debug('TokenManager: Token expired while offline');
				setState(TokenStateEnum.EXPIRED_OFFLINE, currentToken);
				return currentToken;
			}

			const refreshResult = await manager.refreshToken();
			if (refreshResult.success && refreshResult.token) {
				return refreshResult.token;
			}

			if (refreshResult.shouldPreserveAuth) {
				setState(TokenStateEnum.EXPIRED_OFFLINE, currentToken);
				return currentToken;
			}

			return null;
		},

		/**
		 * Handle 401 response
		 */
		async handle401Response(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
			if (state === TokenStateEnum.REFRESHING && refreshPromise) {
				return manager.queueRequest(input, init);
			}

			const refreshResult = await manager.refreshToken();

			if (refreshResult.success && refreshResult.token) {
				return retryRequestWithToken(input, init, refreshResult.token);
			}

			throw new Error(refreshResult.error || 'Token refresh failed');
		},

		/**
		 * Queue a request during token refresh
		 */
		async queueRequest(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
			return new Promise((resolve, reject) => {
				if (requestQueue.length >= MAX_QUEUE_SIZE) {
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

				requestQueue.push(queueItem);

				setTimeout(() => {
					removeFromQueue(queueItem.id);
					reject(new Error('Queued request timeout'));
				}, QUEUE_TIMEOUT_MS);
			});
		},

		/**
		 * Refresh the authentication token
		 */
		async refreshToken(): Promise<InternalTokenRefreshResult> {
			const now = Date.now();
			if (now - lastRefreshTime < REFRESH_COOLDOWN_MS) {
				return { success: false, error: 'Refresh cooldown active' };
			}

			if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
				await handleRefreshFailure();
				return { success: false, error: 'Max refresh attempts reached' };
			}

			if (refreshPromise) {
				return refreshPromise;
			}

			setState(TokenStateEnum.REFRESHING);
			lastRefreshTime = now;

			refreshPromise = performTokenRefreshWithRetry();

			try {
				const result = await refreshPromise;

				if (result.success) {
					refreshAttempts = 0;
					setState(TokenStateEnum.VALID, result.token);
					await processQueuedRequests(result.token!);
				} else {
					refreshAttempts++;
					setState(TokenStateEnum.EXPIRED);
					await rejectQueuedRequests(result.error || 'Token refresh failed');
				}

				return result;
			} finally {
				refreshPromise = null;
			}
		},

		/**
		 * Reset the token manager state
		 */
		reset(): void {
			state = TokenStateEnum.IDLE;
			refreshPromise = null;
			refreshAttempts = 0;
			lastRefreshTime = 0;

			const requests = [...requestQueue];
			requestQueue = [];

			for (const request of requests) {
				request.reject(new Error('Token manager reset'));
			}
		},

		/**
		 * Clear tokens and reset state
		 */
		async clearTokens(): Promise<void> {
			try {
				await authService.clearAuthStorage();
				manager.reset();
			} catch (error) {
				console.debug('Error clearing tokens:', error);
				manager.reset();
			}
		},

		/**
		 * Get queue status for debugging
		 */
		getQueueStatus(): { size: number; state: TokenState; refreshAttempts: number } {
			return {
				size: requestQueue.length,
				state,
				refreshAttempts,
			};
		},

		/**
		 * Check initial token state
		 */
		async checkInitialState(): Promise<void> {
			try {
				const token = await authService.getAppToken();
				if (!token) {
					setState(TokenStateEnum.EXPIRED);
					return;
				}

				if (authService.isTokenValidLocally(token)) {
					setState(TokenStateEnum.VALID, token);
				} else {
					setState(TokenStateEnum.EXPIRED);
				}
			} catch (error) {
				console.debug('Error checking initial token state:', error);
				setState(TokenStateEnum.EXPIRED);
			}
		},
	};

	// Initialize
	manager.checkInitialState();

	return manager;
}

/**
 * Type for the token manager instance
 */
export type TokenManager = ReturnType<typeof createTokenManager>;
