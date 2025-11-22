import { PUBLIC_API_URL } from '$env/static/public';
import type {
	SignInResponse,
	SignUpResponse,
	ManaUser,
	CreditBalance
} from '$lib/types/auth';
import { getUserFromToken } from '$lib/utils/jwt';
import { tokenManager } from './tokenManager';
import { getDeviceInfo } from './deviceManager';

export const authService = {
	/**
	 * Sign in with email and password
	 */
	async signIn(email: string, password: string): Promise<SignInResponse> {
		const deviceInfo = getDeviceInfo();

		const response = await fetch(`${PUBLIC_API_URL}/v1/auth/signin`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email,
				password,
				deviceId: deviceInfo.deviceId,
				deviceName: deviceInfo.deviceName,
				deviceType: deviceInfo.deviceType
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Sign in failed');
		}

		const data: SignInResponse = await response.json();

		// Store tokens
		tokenManager.setTokens(data.appToken, data.refreshToken);

		// Extract user from token
		data.user = getUserFromToken(data.appToken) || undefined;

		return data;
	},

	/**
	 * Sign up with email and password
	 */
	async signUp(
		email: string,
		password: string,
		username?: string
	): Promise<SignUpResponse> {
		const deviceInfo = getDeviceInfo();

		const response = await fetch(`${PUBLIC_API_URL}/v1/auth/signup`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				email,
				password,
				username,
				deviceId: deviceInfo.deviceId,
				deviceName: deviceInfo.deviceName,
				deviceType: deviceInfo.deviceType
			})
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Sign up failed');
		}

		const data: SignUpResponse = await response.json();

		// Store tokens
		tokenManager.setTokens(data.appToken, data.refreshToken);

		// Extract user from token
		data.user = getUserFromToken(data.appToken) || undefined;

		return data;
	},

	/**
	 * Sign out
	 */
	async signOut(): Promise<void> {
		const appToken = tokenManager.getAppToken();

		if (appToken) {
			try {
				await fetch(`${PUBLIC_API_URL}/v1/auth/logout`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${appToken}`
					}
				});
			} catch (error) {
				console.error('Logout request failed:', error);
			}
		}

		// Clear tokens locally
		tokenManager.clearTokens();
	},

	/**
	 * Get current user from token
	 */
	getCurrentUser(): ManaUser | null {
		const appToken = tokenManager.getAppToken();
		if (!appToken) return null;
		return getUserFromToken(appToken);
	},

	/**
	 * Get user credit balance
	 */
	async getCreditBalance(): Promise<CreditBalance> {
		const appToken = await tokenManager.getValidToken();

		const response = await fetch(`${PUBLIC_API_URL}/v1/auth/credits`, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${appToken}`
			}
		});

		if (!response.ok) {
			throw new Error('Failed to fetch credits');
		}

		return response.json();
	},

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return !!tokenManager.getAppToken() && !tokenManager.isExpired();
	},

	/**
	 * Get app token
	 */
	getAppToken(): string | null {
		return tokenManager.getAppToken();
	}
};
