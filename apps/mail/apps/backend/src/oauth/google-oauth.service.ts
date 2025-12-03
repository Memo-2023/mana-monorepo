import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, Auth } from 'googleapis';
import * as crypto from 'crypto';

export interface GoogleTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	scopes: string[];
}

export interface GoogleUserInfo {
	email: string;
	name?: string;
	picture?: string;
}

@Injectable()
export class GoogleOAuthService {
	private oauth2Client: Auth.OAuth2Client;
	private readonly scopes = [
		'https://www.googleapis.com/auth/gmail.readonly',
		'https://www.googleapis.com/auth/gmail.send',
		'https://www.googleapis.com/auth/gmail.modify',
		'https://www.googleapis.com/auth/userinfo.email',
		'https://www.googleapis.com/auth/userinfo.profile',
	];

	constructor(private configService: ConfigService) {
		const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
		const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
		const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

		if (clientId && clientSecret && redirectUri) {
			this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
		}
	}

	private encodeState(data: { userId: string }): string {
		const json = JSON.stringify(data);
		return Buffer.from(json).toString('base64url');
	}

	private decodeState(state: string): { userId: string } {
		try {
			const json = Buffer.from(state, 'base64url').toString('utf-8');
			return JSON.parse(json);
		} catch {
			throw new BadRequestException('Invalid state parameter');
		}
	}

	isConfigured(): boolean {
		return !!this.oauth2Client;
	}

	getAuthUrl(userId: string): string {
		if (!this.isConfigured()) {
			throw new BadRequestException('Google OAuth is not configured');
		}

		const state = this.encodeState({ userId });

		return this.oauth2Client.generateAuthUrl({
			access_type: 'offline',
			scope: this.scopes,
			state,
			prompt: 'consent', // Force consent to get refresh token
		});
	}

	async handleCallback(
		code: string,
		state: string
	): Promise<{ userId: string; tokens: GoogleTokens; userInfo: GoogleUserInfo }> {
		if (!this.isConfigured()) {
			throw new BadRequestException('Google OAuth is not configured');
		}

		const { userId } = this.decodeState(state);

		// Exchange code for tokens
		const { tokens } = await this.oauth2Client.getToken(code);

		if (!tokens.access_token) {
			throw new BadRequestException('Failed to get access token from Google');
		}

		// Get user info
		this.oauth2Client.setCredentials(tokens);
		const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
		const { data: userInfo } = await oauth2.userinfo.get();

		const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : undefined;

		return {
			userId,
			tokens: {
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token || undefined,
				expiresAt,
				scopes: tokens.scope?.split(' ') || this.scopes,
			},
			userInfo: {
				email: userInfo.email || '',
				name: userInfo.name || undefined,
				picture: userInfo.picture || undefined,
			},
		};
	}

	async refreshAccessToken(refreshToken: string): Promise<GoogleTokens> {
		if (!this.isConfigured()) {
			throw new BadRequestException('Google OAuth is not configured');
		}

		this.oauth2Client.setCredentials({ refresh_token: refreshToken });

		const { credentials } = await this.oauth2Client.refreshAccessToken();

		if (!credentials.access_token) {
			throw new BadRequestException('Failed to refresh access token');
		}

		return {
			accessToken: credentials.access_token,
			refreshToken: credentials.refresh_token || refreshToken,
			expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
			scopes: credentials.scope?.split(' ') || this.scopes,
		};
	}

	getAuthenticatedClient(accessToken: string): Auth.OAuth2Client {
		if (!this.isConfigured()) {
			throw new BadRequestException('Google OAuth is not configured');
		}

		const client = new google.auth.OAuth2(
			this.configService.get<string>('GOOGLE_CLIENT_ID'),
			this.configService.get<string>('GOOGLE_CLIENT_SECRET')
		);
		client.setCredentials({ access_token: accessToken });
		return client;
	}
}
