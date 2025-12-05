import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@microsoft/microsoft-graph-client';

export interface MicrosoftTokens {
	accessToken: string;
	refreshToken?: string;
	expiresAt?: Date;
	scopes: string[];
}

export interface MicrosoftUserInfo {
	email: string;
	name?: string;
}

@Injectable()
export class MicrosoftOAuthService {
	private clientId: string;
	private clientSecret: string;
	private redirectUri: string;
	private tenantId: string;

	private readonly scopes = [
		'Mail.Read',
		'Mail.Send',
		'Mail.ReadWrite',
		'User.Read',
		'offline_access',
	];

	constructor(private configService: ConfigService) {
		this.clientId = this.configService.get<string>('MICROSOFT_CLIENT_ID') || '';
		this.clientSecret = this.configService.get<string>('MICROSOFT_CLIENT_SECRET') || '';
		this.redirectUri = this.configService.get<string>('MICROSOFT_REDIRECT_URI') || '';
		this.tenantId = this.configService.get<string>('MICROSOFT_TENANT_ID') || 'common';
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
		return !!(this.clientId && this.clientSecret && this.redirectUri);
	}

	getAuthUrl(userId: string): string {
		if (!this.isConfigured()) {
			throw new BadRequestException('Microsoft OAuth is not configured');
		}

		const state = this.encodeState({ userId });
		const scope = this.scopes.join(' ');

		const params = new URLSearchParams({
			client_id: this.clientId,
			response_type: 'code',
			redirect_uri: this.redirectUri,
			response_mode: 'query',
			scope,
			state,
			prompt: 'consent',
		});

		return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
	}

	async handleCallback(
		code: string,
		state: string
	): Promise<{ userId: string; tokens: MicrosoftTokens; userInfo: MicrosoftUserInfo }> {
		if (!this.isConfigured()) {
			throw new BadRequestException('Microsoft OAuth is not configured');
		}

		const { userId } = this.decodeState(state);

		// Exchange code for tokens
		const tokenResponse = await fetch(
			`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					code,
					redirect_uri: this.redirectUri,
					grant_type: 'authorization_code',
					scope: this.scopes.join(' '),
				}),
			}
		);

		if (!tokenResponse.ok) {
			const error = await tokenResponse.text();
			throw new BadRequestException(`Failed to get tokens from Microsoft: ${error}`);
		}

		const tokenData = await tokenResponse.json();

		// Get user info using Graph API
		const client = Client.init({
			authProvider: (done) => {
				done(null, tokenData.access_token);
			},
		});

		const user = await client.api('/me').select('mail,displayName,userPrincipalName').get();

		const expiresAt = tokenData.expires_in
			? new Date(Date.now() + tokenData.expires_in * 1000)
			: undefined;

		return {
			userId,
			tokens: {
				accessToken: tokenData.access_token,
				refreshToken: tokenData.refresh_token,
				expiresAt,
				scopes: tokenData.scope?.split(' ') || this.scopes,
			},
			userInfo: {
				email: user.mail || user.userPrincipalName || '',
				name: user.displayName || undefined,
			},
		};
	}

	async refreshAccessToken(refreshToken: string): Promise<MicrosoftTokens> {
		if (!this.isConfigured()) {
			throw new BadRequestException('Microsoft OAuth is not configured');
		}

		const tokenResponse = await fetch(
			`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: new URLSearchParams({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					refresh_token: refreshToken,
					grant_type: 'refresh_token',
					scope: this.scopes.join(' '),
				}),
			}
		);

		if (!tokenResponse.ok) {
			const error = await tokenResponse.text();
			throw new BadRequestException(`Failed to refresh Microsoft token: ${error}`);
		}

		const tokenData = await tokenResponse.json();

		const expiresAt = tokenData.expires_in
			? new Date(Date.now() + tokenData.expires_in * 1000)
			: undefined;

		return {
			accessToken: tokenData.access_token,
			refreshToken: tokenData.refresh_token || refreshToken,
			expiresAt,
			scopes: tokenData.scope?.split(' ') || this.scopes,
		};
	}

	getGraphClient(accessToken: string): Client {
		return Client.init({
			authProvider: (done) => {
				done(null, accessToken);
			},
		});
	}
}
