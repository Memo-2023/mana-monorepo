import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UserSession {
	matrixUserId: string;
	jwtToken?: string;
	tokenExpiry?: Date;
	pendingImage?: { url: string; mimeType: string };
	lastActivity: Date;
}

export interface LoginResult {
	success: boolean;
	token?: string;
	error?: string;
}

@Injectable()
export class SessionService {
	private readonly logger = new Logger(SessionService.name);
	private sessions: Map<string, UserSession> = new Map();
	private readonly authUrl: string;
	private readonly devBypass: boolean;
	private readonly devUserId: string;

	constructor(private configService: ConfigService) {
		this.authUrl = this.configService.get<string>('auth.url') || 'http://localhost:3001';
		this.devBypass = this.configService.get<boolean>('auth.devBypass') || false;
		this.devUserId = this.configService.get<string>('auth.devUserId') || '';
	}

	getSession(matrixUserId: string): UserSession {
		if (!this.sessions.has(matrixUserId)) {
			this.sessions.set(matrixUserId, {
				matrixUserId,
				lastActivity: new Date(),
			});
		}
		const session = this.sessions.get(matrixUserId)!;
		session.lastActivity = new Date();
		return session;
	}

	isLoggedIn(matrixUserId: string): boolean {
		if (this.devBypass && this.devUserId) {
			return true;
		}

		const session = this.sessions.get(matrixUserId);
		if (!session?.jwtToken || !session.tokenExpiry) {
			return false;
		}

		// Check if token is expired (with 5 minute buffer)
		const now = new Date();
		const expiryBuffer = new Date(session.tokenExpiry.getTime() - 5 * 60 * 1000);
		return now < expiryBuffer;
	}

	getToken(matrixUserId: string): string | null {
		if (this.devBypass && this.devUserId) {
			// In dev mode, return a mock token (the backend should also bypass auth)
			return 'dev-bypass-token';
		}

		const session = this.sessions.get(matrixUserId);
		if (!session?.jwtToken || !this.isLoggedIn(matrixUserId)) {
			return null;
		}
		return session.jwtToken;
	}

	async login(matrixUserId: string, email: string, password: string): Promise<LoginResult> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const error = await response.text();
				this.logger.warn(`Login failed for ${matrixUserId}: ${response.status}`);
				return { success: false, error: `Login fehlgeschlagen: ${error}` };
			}

			const data = await response.json();
			const { accessToken, expiresIn } = data;

			if (!accessToken) {
				return { success: false, error: 'Kein Token erhalten' };
			}

			// Calculate expiry time (expiresIn is in seconds)
			const expiryTime = expiresIn
				? new Date(Date.now() + expiresIn * 1000)
				: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default: 7 days

			const session = this.getSession(matrixUserId);
			session.jwtToken = accessToken;
			session.tokenExpiry = expiryTime;

			this.logger.log(`User ${matrixUserId} logged in successfully`);
			return { success: true, token: accessToken };
		} catch (error) {
			this.logger.error(`Login error for ${matrixUserId}:`, error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unbekannter Fehler',
			};
		}
	}

	logout(matrixUserId: string): void {
		const session = this.sessions.get(matrixUserId);
		if (session) {
			session.jwtToken = undefined;
			session.tokenExpiry = undefined;
		}
		this.logger.log(`User ${matrixUserId} logged out`);
	}

	setPendingImage(matrixUserId: string, url: string, mimeType: string): void {
		const session = this.getSession(matrixUserId);
		session.pendingImage = { url, mimeType };
	}

	getPendingImage(matrixUserId: string): { url: string; mimeType: string } | undefined {
		return this.sessions.get(matrixUserId)?.pendingImage;
	}

	clearPendingImage(matrixUserId: string): void {
		const session = this.sessions.get(matrixUserId);
		if (session) {
			session.pendingImage = undefined;
		}
	}

	getSessionCount(): number {
		return this.sessions.size;
	}

	getLoggedInCount(): number {
		let count = 0;
		for (const [userId] of this.sessions) {
			if (this.isLoggedIn(userId)) {
				count++;
			}
		}
		return count;
	}
}
