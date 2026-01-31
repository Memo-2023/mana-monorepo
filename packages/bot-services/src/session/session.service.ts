import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	UserSession,
	LoginResult,
	SessionStats,
	SessionModuleOptions,
	SESSION_MODULE_OPTIONS,
	DEFAULT_SESSION_EXPIRY_MS,
} from './types';

/**
 * Shared session management service for Matrix bots
 *
 * Manages user authentication sessions linking Matrix user IDs to mana-core-auth JWT tokens.
 * Sessions are stored in-memory and automatically expire.
 *
 * @example
 * ```typescript
 * // In NestJS module
 * imports: [SessionModule.register({ authUrl: 'http://mana-core-auth:3001' })]
 *
 * // In service/controller
 * const result = await sessionService.login(matrixUserId, email, password);
 * const token = sessionService.getToken(matrixUserId);
 * ```
 */
@Injectable()
export class SessionService {
	private readonly logger = new Logger(SessionService.name);
	private sessions: Map<string, UserSession> = new Map();
	private readonly authUrl: string;
	private readonly sessionExpiryMs: number;
	private readonly loginPath: string;

	constructor(
		@Optional() private configService: ConfigService,
		@Optional() @Inject(SESSION_MODULE_OPTIONS) private options?: SessionModuleOptions
	) {
		// Priority: module options > config > environment > default
		this.authUrl =
			options?.authUrl ||
			this.configService?.get<string>('auth.url') ||
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			'http://localhost:3001';

		this.sessionExpiryMs = options?.sessionExpiryMs || DEFAULT_SESSION_EXPIRY_MS;
		this.loginPath = options?.loginPath || '/api/v1/auth/login';

		this.logger.log(`Auth URL: ${this.authUrl}`);
	}

	/**
	 * Login a Matrix user with mana-core-auth credentials
	 *
	 * @param matrixUserId - Matrix user ID (e.g., "@user:matrix.mana.how")
	 * @param email - User's email
	 * @param password - User's password
	 * @returns Login result with success status
	 */
	async login(matrixUserId: string, email: string, password: string): Promise<LoginResult> {
		try {
			const response = await fetch(`${this.authUrl}${this.loginPath}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const errorData = (await response.json().catch(() => ({}))) as { message?: string };
				return {
					success: false,
					error: errorData.message || 'Authentifizierung fehlgeschlagen',
				};
			}

			const data = (await response.json()) as { accessToken?: string; token?: string };
			const token = data.accessToken || data.token;

			if (!token) {
				return { success: false, error: 'Kein Token erhalten' };
			}

			// Store session with expiry
			this.sessions.set(matrixUserId, {
				token,
				email,
				expiresAt: new Date(Date.now() + this.sessionExpiryMs),
			});

			this.logger.log(`User ${matrixUserId} logged in as ${email}`);
			return { success: true, email };
		} catch (error) {
			this.logger.error(`Login failed for ${matrixUserId}:`, error);
			return {
				success: false,
				error: 'Verbindung zum Auth-Server fehlgeschlagen',
			};
		}
	}

	/**
	 * Logout a Matrix user
	 */
	logout(matrixUserId: string): void {
		this.sessions.delete(matrixUserId);
		this.logger.log(`User ${matrixUserId} logged out`);
	}

	/**
	 * Get JWT token for a Matrix user (null if not logged in or expired)
	 */
	getToken(matrixUserId: string): string | null {
		const session = this.sessions.get(matrixUserId);

		if (!session) return null;

		// Check if token expired
		if (session.expiresAt < new Date()) {
			this.sessions.delete(matrixUserId);
			return null;
		}

		return session.token;
	}

	/**
	 * Check if a Matrix user is logged in
	 */
	isLoggedIn(matrixUserId: string): boolean {
		return this.getToken(matrixUserId) !== null;
	}

	/**
	 * Get the full session object for a Matrix user
	 */
	getSession(matrixUserId: string): UserSession | null {
		const token = this.getToken(matrixUserId); // This handles expiry check
		if (!token) return null;
		return this.sessions.get(matrixUserId) || null;
	}

	/**
	 * Get email for a logged-in Matrix user
	 */
	getEmail(matrixUserId: string): string | null {
		const session = this.getSession(matrixUserId);
		return session?.email || null;
	}

	/**
	 * Store custom data in a user's session
	 */
	setSessionData(matrixUserId: string, key: string, value: unknown): void {
		const session = this.sessions.get(matrixUserId);
		if (session) {
			session.data = session.data || {};
			session.data[key] = value;
		}
	}

	/**
	 * Get custom data from a user's session
	 */
	getSessionData<T = unknown>(matrixUserId: string, key: string): T | null {
		const session = this.getSession(matrixUserId);
		return (session?.data?.[key] as T) || null;
	}

	/**
	 * Get total session count (including expired)
	 */
	getSessionCount(): number {
		return this.sessions.size;
	}

	/**
	 * Get count of active (non-expired) sessions
	 */
	getActiveSessionCount(): number {
		const now = new Date();
		let count = 0;
		for (const session of this.sessions.values()) {
			if (session.expiresAt > now) count++;
		}
		return count;
	}

	/**
	 * Get session statistics
	 */
	getStats(): SessionStats {
		return {
			total: this.getSessionCount(),
			active: this.getActiveSessionCount(),
		};
	}

	/**
	 * Clean up expired sessions (can be called periodically)
	 */
	cleanupExpiredSessions(): number {
		const now = new Date();
		let cleaned = 0;

		for (const [userId, session] of this.sessions.entries()) {
			if (session.expiresAt < now) {
				this.sessions.delete(userId);
				cleaned++;
			}
		}

		if (cleaned > 0) {
			this.logger.log(`Cleaned up ${cleaned} expired sessions`);
		}

		return cleaned;
	}

	/**
	 * Get all active session user IDs
	 */
	getActiveUserIds(): string[] {
		const now = new Date();
		const userIds: string[] = [];

		for (const [userId, session] of this.sessions.entries()) {
			if (session.expiresAt > now) {
				userIds.push(userId);
			}
		}

		return userIds;
	}
}
