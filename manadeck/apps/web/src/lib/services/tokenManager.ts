import { PUBLIC_API_URL } from '$env/static/public';
import { decodeToken, isTokenExpired, getTokenExpiresIn } from '$lib/utils/jwt';
import { getDeviceInfo } from './deviceManager';

const TOKEN_REFRESH_BUFFER = 10; // seconds before expiry to trigger refresh
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAYS = [0, 1000, 2000, 5000]; // Progressive backoff

interface TokenState {
	appToken: string | null;
	refreshToken: string | null;
	isRefreshing: boolean;
	refreshPromise: Promise<string> | null;
}

class TokenManager {
	private state: TokenState = {
		appToken: null,
		refreshToken: null,
		isRefreshing: false,
		refreshPromise: null
	};

	constructor() {
		if (typeof window !== 'undefined') {
			this.loadTokens();
		}
	}

	private loadTokens() {
		this.state.appToken = sessionStorage.getItem('appToken');
		this.state.refreshToken = sessionStorage.getItem('refreshToken');
	}

	private saveTokens(appToken: string, refreshToken: string) {
		this.state.appToken = appToken;
		this.state.refreshToken = refreshToken;
		sessionStorage.setItem('appToken', appToken);
		sessionStorage.setItem('refreshToken', refreshToken);
	}

	clearTokens() {
		this.state.appToken = null;
		this.state.refreshToken = null;
		sessionStorage.removeItem('appToken');
		sessionStorage.removeItem('refreshToken');
		sessionStorage.removeItem('deviceId');
	}

	getAppToken(): string | null {
		return this.state.appToken;
	}

	getRefreshToken(): string | null {
		return this.state.refreshToken;
	}

	setTokens(appToken: string, refreshToken: string) {
		this.saveTokens(appToken, refreshToken);
	}

	/**
	 * Check if token needs refresh
	 */
	needsRefresh(): boolean {
		if (!this.state.appToken) return false;
		const expiresIn = getTokenExpiresIn(this.state.appToken);
		return expiresIn > 0 && expiresIn <= TOKEN_REFRESH_BUFFER;
	}

	/**
	 * Check if token is expired
	 */
	isExpired(): boolean {
		if (!this.state.appToken) return true;
		return isTokenExpired(this.state.appToken);
	}

	/**
	 * Refresh token with retry logic
	 */
	async refreshAppToken(retryCount = 0): Promise<string> {
		// If already refreshing, wait for that promise
		if (this.state.isRefreshing && this.state.refreshPromise) {
			return this.state.refreshPromise;
		}

		// Start new refresh
		this.state.isRefreshing = true;
		this.state.refreshPromise = this._performRefresh(retryCount);

		try {
			const newToken = await this.state.refreshPromise;
			return newToken;
		} finally {
			this.state.isRefreshing = false;
			this.state.refreshPromise = null;
		}
	}

	private async _performRefresh(retryCount: number): Promise<string> {
		if (!this.state.refreshToken) {
			throw new Error('No refresh token available');
		}

		try {
			const deviceInfo = getDeviceInfo();

			const response = await fetch(`${PUBLIC_API_URL}/v1/auth/refresh`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					refreshToken: this.state.refreshToken,
					deviceId: deviceInfo.deviceId
				})
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.message || 'Token refresh failed');
			}

			const data = await response.json();
			const { appToken, refreshToken } = data;

			// Save new tokens
			this.saveTokens(appToken, refreshToken);

			return appToken;
		} catch (error) {
			// Retry logic
			if (retryCount < MAX_RETRY_ATTEMPTS) {
				const delay = RETRY_DELAYS[retryCount];
				await new Promise((resolve) => setTimeout(resolve, delay));
				return this.refreshAppToken(retryCount + 1);
			}

			// Max retries reached, clear tokens
			this.clearTokens();
			throw error;
		}
	}

	/**
	 * Get valid token (refreshes if needed)
	 */
	async getValidToken(): Promise<string> {
		if (!this.state.appToken) {
			throw new Error('No token available');
		}

		if (this.isExpired()) {
			// Token is expired, try to refresh
			return this.refreshAppToken();
		}

		if (this.needsRefresh()) {
			// Token expires soon, refresh in background
			this.refreshAppToken().catch(console.error);
		}

		return this.state.appToken;
	}
}

// Export singleton
export const tokenManager = new TokenManager();
