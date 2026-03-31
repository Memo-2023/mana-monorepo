import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, map, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { BrandingConfig, SignupMetadata } from './interfaces/branding.interface';

@Injectable()
export class AuthProxyService {
	private manaServiceUrl: string;
	private memoroAppId: string;

	constructor(
		private httpService: HttpService,
		private configService: ConfigService
	) {
		this.manaServiceUrl = this.configService.get<string>(
			'MANA_SERVICE_URL',
			'http://localhost:3000'
		);
		this.memoroAppId = this.configService.get<string>(
			'MEMORO_APP_ID',
			'973da0c1-b479-4dac-a1b0-ed09c72caca8'
		);
	}

	/**
	 * Generic proxy method for POST requests
	 */
	private async proxyPost(endpoint: string, payload: any, headers: any = {}) {
		const url = `${this.manaServiceUrl}${endpoint}?appId=${this.memoroAppId}`;

		console.log(`[AuthProxy] Proxying POST request to: ${endpoint}`);

		try {
			const response = await firstValueFrom(
				this.httpService
					.post(url, payload, {
						headers: {
							'Content-Type': 'application/json',
							...headers,
						},
					})
					.pipe(
						map((res) => res.data),
						catchError((error: AxiosError) => {
							console.error(`[AuthProxy] Error from mana-core-middleware:`, error.response?.data);

							// Preserve the original error response
							if (error.response) {
								throw new HttpException(
									error.response.data || 'Request failed',
									error.response.status
								);
							}

							throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
						})
					)
			);

			return response;
		} catch (error) {
			console.error(`[AuthProxy] Error proxying ${endpoint}:`, error);
			throw error;
		}
	}

	/**
	 * Generic proxy method for GET requests
	 */
	private async proxyGet(endpoint: string, headers: any = {}) {
		const url = `${this.manaServiceUrl}${endpoint}?appId=${this.memoroAppId}`;

		console.log(`[AuthProxy] Proxying GET request to: ${endpoint}`);

		try {
			const response = await firstValueFrom(
				this.httpService
					.get(url, {
						headers: {
							...headers,
						},
					})
					.pipe(
						map((res) => res.data),
						catchError((error: AxiosError) => {
							console.error(`[AuthProxy] Error from mana-core-middleware:`, error.response?.data);

							// Preserve the original error response
							if (error.response) {
								throw new HttpException(
									error.response.data || 'Request failed',
									error.response.status
								);
							}

							throw new HttpException('Service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
						})
					)
			);

			return response;
		} catch (error) {
			console.error(`[AuthProxy] Error proxying ${endpoint}:`, error);
			throw error;
		}
	}

	// Auth endpoints
	async signin(payload: any) {
		// Log signin payload to understand device info flow
		console.log('[AuthProxy] Signin request payload:', JSON.stringify(payload, null, 2));

		if (payload.deviceInfo || payload.device_info) {
			console.log('[AuthProxy] Device info present in signin request');
		}

		return this.proxyPost('/auth/signin', payload);
	}

	async signup(payload: any) {
		// Hardcoded Memoro branding configuration
		const memoroBranding: BrandingConfig = {
			appName: 'Memoro',
			logoUrl: 'memoro-logo.png',
			primaryColor: '#F8D62B',
			secondaryColor: '#f5c500',
			websiteUrl: 'https://memoro.ai',
			taglineDe: 'Sprechen statt Tippen',
			taglineEn: 'Speak Instead of Type',
			copyright: '© 2025 Memoro · Made with 💛 in Germany',
		};

		// Build payload with Memoro branding
		const enhancedPayload: any = {
			...payload,
			redirectUrl: 'https://app.manacore.ai/welcome?appName=memoro',
		};

		// Add Memoro branding if not already provided in payload
		if (!enhancedPayload.metadata) {
			enhancedPayload.metadata = {};
		}

		// Merge: payload branding overrides default Memoro branding if provided
		if (!enhancedPayload.metadata.branding) {
			enhancedPayload.metadata.branding = memoroBranding;
		} else {
			// Merge: payload overrides default
			enhancedPayload.metadata.branding = {
				...memoroBranding,
				...enhancedPayload.metadata.branding,
			};
		}

		return this.proxyPost('/auth/signup', enhancedPayload);
	}

	async googleSignin(payload: any) {
		return this.proxyPost('/auth/google-signin', payload);
	}

	async appleSignin(payload: any) {
		return this.proxyPost('/auth/apple-signin', payload);
	}

	async refresh(payload: any) {
		// Log the refresh payload to debug device info issues
		console.log('[AuthProxy] Refresh request payload:', JSON.stringify(payload, null, 2));

		// Check if device info is present - it's required for refresh
		if (!payload.deviceInfo) {
			console.error('[AuthProxy] Error: No device info in refresh request');
			throw new HttpException(
				{
					error: 'Bad Request',
					message: 'Device info is required for token refresh',
					statusCode: 400,
				},
				HttpStatus.BAD_REQUEST
			);
		}

		// Ensure the payload has the correct structure
		const refreshPayload = {
			refreshToken: payload.refreshToken,
			appId: payload.appId || this.memoroAppId,
			deviceInfo: payload.deviceInfo,
		};

		// Validate required fields
		if (!refreshPayload.refreshToken) {
			throw new HttpException(
				{ error: 'Bad Request', message: 'Refresh token is required', statusCode: 400 },
				HttpStatus.BAD_REQUEST
			);
		}

		console.log('[AuthProxy] Device info included in refresh request');

		return this.proxyPost('/auth/refresh', refreshPayload);
	}

	async logout(payload: any) {
		return this.proxyPost('/auth/logout', payload);
	}

	async forgotPassword(payload: any) {
		return this.proxyPost('/auth/forgot-password', payload);
	}

	async validate(payload: any) {
		return this.proxyPost('/auth/validate', payload);
	}

	async getCredits(authHeader: string) {
		return this.proxyGet('/auth/credits', {
			Authorization: authHeader,
		});
	}

	async getDevices(authHeader: string) {
		return this.proxyGet('/auth/devices', {
			Authorization: authHeader,
		});
	}
}
