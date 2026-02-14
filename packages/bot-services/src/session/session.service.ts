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
import { RedisSessionProvider } from './redis-session.provider';

/**
 * Injection token for Redis session provider
 */
export const REDIS_SESSION_PROVIDER = 'REDIS_SESSION_PROVIDER';

/**
 * Shared session management service for Matrix bots
 *
 * Manages user authentication sessions linking Matrix user IDs to mana-core-auth JWT tokens.
 *
 * Features:
 * - **In-memory mode** (default): Sessions stored per bot instance
 * - **Redis mode**: Sessions shared across ALL bots (SSO)
 * - **Matrix-SSO-Link**: Automatic login for users who logged into Matrix via OIDC
 *
 * @example
 * ```typescript
 * // In NestJS module - with Redis for cross-bot SSO
 * imports: [SessionModule.forRoot({ storageMode: 'redis' })]
 *
 * // In service/controller
 * const token = await sessionService.getToken(matrixUserId);
 * // Token is available across ALL bots!
 * ```
 */
/**
 * Buffer time before JWT expiry to trigger refresh (in seconds)
 * Refresh tokens 60 seconds before they expire to avoid edge cases
 */
const JWT_REFRESH_BUFFER_SECONDS = 60;

@Injectable()
export class SessionService {
	private readonly logger = new Logger(SessionService.name);
	private sessions: Map<string, UserSession> = new Map();
	private readonly authUrl: string;
	private readonly sessionExpiryMs: number;
	private readonly loginPath: string;
	private readonly enableMatrixSsoLink: boolean;
	private readonly serviceKey: string | undefined;

	constructor(
		@Optional() private configService: ConfigService,
		@Optional() @Inject(SESSION_MODULE_OPTIONS) private options?: SessionModuleOptions,
		@Optional() @Inject(REDIS_SESSION_PROVIDER) private redisProvider?: RedisSessionProvider
	) {
		// Priority: module options > config > environment > default
		this.authUrl =
			options?.authUrl ||
			this.configService?.get<string>('auth.url') ||
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			'http://localhost:3001';

		this.sessionExpiryMs = options?.sessionExpiryMs || DEFAULT_SESSION_EXPIRY_MS;
		this.loginPath = options?.loginPath || '/api/v1/auth/login';

		// Matrix-SSO-Link settings
		this.enableMatrixSsoLink = options?.enableMatrixSsoLink ?? options?.storageMode === 'redis';
		this.serviceKey =
			options?.serviceKey || this.configService?.get<string>('MANA_CORE_SERVICE_KEY');

		const mode = this.redisProvider?.isConnected() ? 'redis' : 'memory';
		this.logger.log(
			`Auth URL: ${this.authUrl}, Storage: ${mode}, Matrix-SSO-Link: ${this.enableMatrixSsoLink}`
		);
	}

	/**
	 * Check if using Redis storage
	 */
	private useRedis(): boolean {
		return this.redisProvider?.isConnected() ?? false;
	}

	/**
	 * Decode JWT and check if it's expired or about to expire
	 *
	 * @param token - JWT token string
	 * @returns true if token is valid and not expired, false otherwise
	 */
	private isTokenValid(token: string): boolean {
		try {
			// JWT format: header.payload.signature
			const parts = token.split('.');
			if (parts.length !== 3) {
				this.logger.debug('Invalid JWT format');
				return false;
			}

			// Decode payload (base64url)
			const payload = JSON.parse(
				Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
			);

			if (!payload.exp) {
				this.logger.debug('JWT has no exp claim');
				return true; // No expiry = valid
			}

			// Check if expired (with buffer)
			const now = Math.floor(Date.now() / 1000);
			const expiresAt = payload.exp;
			const isValid = expiresAt > now + JWT_REFRESH_BUFFER_SECONDS;

			if (!isValid) {
				this.logger.debug(
					`JWT expired or expiring soon: exp=${expiresAt}, now=${now}, buffer=${JWT_REFRESH_BUFFER_SECONDS}s`
				);
			}

			return isValid;
		} catch (error) {
			this.logger.debug(`Failed to decode JWT: ${error}`);
			return false;
		}
	}

	/**
	 * Get or create a session for a Matrix user
	 *
	 * This method tries multiple sources in order:
	 * 1. Redis cache (if enabled) - validates JWT expiry
	 * 2. In-memory cache - validates JWT expiry
	 * 3. Matrix-SSO-Link lookup (automatic login if user logged into Matrix via OIDC)
	 *
	 * If a cached token is expired, it automatically fetches a fresh one via SSO-Link.
	 *
	 * @param matrixUserId - Matrix user ID (e.g., "@user:matrix.mana.how")
	 * @returns JWT token or null if not logged in
	 */
	async getToken(matrixUserId: string): Promise<string | null> {
		// 1. Try Redis first
		if (this.useRedis()) {
			const token = await this.redisProvider!.getToken(matrixUserId);
			if (token) {
				// Check if JWT is still valid
				if (this.isTokenValid(token)) {
					this.logger.debug(`Found valid token in Redis for ${matrixUserId}`);
					return token;
				}
				// Token expired - try to refresh via SSO-Link
				this.logger.debug(`Token in Redis expired for ${matrixUserId}, refreshing...`);
				const freshToken = await this.refreshToken(matrixUserId);
				if (freshToken) {
					return freshToken;
				}
				// Refresh failed - clear invalid session
				await this.redisProvider!.deleteSession(matrixUserId);
			}
		}

		// 2. Try in-memory cache
		const session = this.sessions.get(matrixUserId);
		if (session) {
			if (session.expiresAt < new Date()) {
				this.sessions.delete(matrixUserId);
			} else if (this.isTokenValid(session.token)) {
				this.logger.debug(`Found valid token in memory for ${matrixUserId}`);
				return session.token;
			} else {
				// Token expired - try to refresh via SSO-Link
				this.logger.debug(`Token in memory expired for ${matrixUserId}, refreshing...`);
				const freshToken = await this.refreshToken(matrixUserId);
				if (freshToken) {
					return freshToken;
				}
				// Refresh failed - clear invalid session
				this.sessions.delete(matrixUserId);
			}
		}

		// 3. Try Matrix-SSO-Link (automatic login)
		this.logger.debug(
			`No cached token for ${matrixUserId}, trying SSO-Link (enabled: ${this.enableMatrixSsoLink}, hasServiceKey: ${!!this.serviceKey})`
		);
		if (this.enableMatrixSsoLink) {
			const token = await this.fetchMatrixLinkedToken(matrixUserId);
			if (token) {
				this.logger.log(`Matrix-SSO-Link: auto-login successful for ${matrixUserId}`);
				// Cache the token
				await this.storeSession(matrixUserId, {
					token,
					email: '', // Unknown from SSO link
					expiresAt: new Date(Date.now() + this.sessionExpiryMs),
				});
				return token;
			}
		}

		return null;
	}

	/**
	 * Refresh an expired token via Matrix-SSO-Link
	 *
	 * @param matrixUserId - Matrix user ID
	 * @returns Fresh JWT token or null if refresh failed
	 */
	private async refreshToken(matrixUserId: string): Promise<string | null> {
		if (!this.enableMatrixSsoLink) {
			this.logger.debug('Cannot refresh token: SSO-Link disabled');
			return null;
		}

		const freshToken = await this.fetchMatrixLinkedToken(matrixUserId);
		if (freshToken) {
			this.logger.log(`Token refreshed via SSO-Link for ${matrixUserId}`);
			// Update cached session with fresh token
			await this.storeSession(matrixUserId, {
				token: freshToken,
				email: '', // Unknown from SSO link
				expiresAt: new Date(Date.now() + this.sessionExpiryMs),
			});
			return freshToken;
		}

		this.logger.warn(`Token refresh failed for ${matrixUserId}`);
		return null;
	}

	/**
	 * Fetch token via Matrix-SSO-Link from mana-core-auth
	 *
	 * If the user logged into Matrix via OIDC (Sign in with Mana Core),
	 * their Matrix user ID is linked to their Mana account.
	 * This method fetches a JWT token for that link.
	 */
	private async fetchMatrixLinkedToken(matrixUserId: string): Promise<string | null> {
		if (!this.serviceKey) {
			this.logger.debug('Matrix-SSO-Link disabled: no service key configured');
			return null;
		}

		try {
			// Note: mana-core-auth has double prefix due to global prefix + controller prefix
			const response = await fetch(
				`${this.authUrl}/api/v1/api/v1/auth/matrix-session/${encodeURIComponent(matrixUserId)}`,
				{
					headers: {
						'X-Service-Key': this.serviceKey,
						'Content-Type': 'application/json',
					},
				}
			);

			if (!response.ok) {
				// 404 = no link exists, which is normal for users who didn't use OIDC
				if (response.status !== 404) {
					this.logger.warn(`Matrix-SSO-Link lookup failed: ${response.status}`);
				}
				return null;
			}

			const data = (await response.json()) as { token?: string };
			if (data.token) {
				this.logger.log(`Matrix-SSO-Link: auto-login for ${matrixUserId}`);
				return data.token;
			}

			return null;
		} catch (error) {
			this.logger.debug(`Matrix-SSO-Link lookup error: ${error}`);
			return null;
		}
	}

	/**
	 * Store session in Redis and/or memory
	 */
	private async storeSession(matrixUserId: string, session: UserSession): Promise<void> {
		// Store in Redis if available
		if (this.useRedis()) {
			await this.redisProvider!.setSession(matrixUserId, session);
		}

		// Also store in memory as fallback
		this.sessions.set(matrixUserId, session);
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

			// Store session
			const session: UserSession = {
				token,
				email,
				expiresAt: new Date(Date.now() + this.sessionExpiryMs),
			};

			await this.storeSession(matrixUserId, session);

			// Store persistent link in mana-core-auth for future auto-login
			await this.createMatrixUserLink(matrixUserId, token, email);

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
	 * Create a persistent link between Matrix user ID and Mana account
	 *
	 * This allows the bot to auto-authenticate the user in the future
	 * without requiring another !login command.
	 */
	private async createMatrixUserLink(
		matrixUserId: string,
		token: string,
		email: string
	): Promise<void> {
		try {
			// Note: mana-core-auth has double prefix due to global prefix + controller prefix
			const response = await fetch(`${this.authUrl}/api/v1/api/v1/auth/matrix-user-links`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ matrixUserId, email }),
			});

			if (response.ok) {
				this.logger.log(`Matrix-SSO-Link: created link for ${matrixUserId}`);
			} else {
				// Non-critical - log but don't fail the login
				this.logger.debug(
					`Matrix-SSO-Link: failed to create link for ${matrixUserId}: ${response.status}`
				);
			}
		} catch (error) {
			// Non-critical - log but don't fail the login
			this.logger.debug(`Matrix-SSO-Link: error creating link for ${matrixUserId}: ${error}`);
		}
	}

	/**
	 * Logout a Matrix user
	 */
	async logout(matrixUserId: string): Promise<void> {
		// Remove from Redis
		if (this.useRedis()) {
			await this.redisProvider!.deleteSession(matrixUserId);
		}

		// Remove from memory
		this.sessions.delete(matrixUserId);
		this.logger.log(`User ${matrixUserId} logged out`);
	}

	/**
	 * Check if a Matrix user is logged in
	 */
	async isLoggedIn(matrixUserId: string): Promise<boolean> {
		const token = await this.getToken(matrixUserId);
		return token !== null;
	}

	/**
	 * Get the full session object for a Matrix user
	 */
	async getSession(matrixUserId: string): Promise<UserSession | null> {
		// Try Redis first
		if (this.useRedis()) {
			const session = await this.redisProvider!.getSession(matrixUserId);
			if (session) return session;
		}

		// Try memory
		const session = this.sessions.get(matrixUserId);
		if (!session) return null;

		// Check expiry
		if (session.expiresAt < new Date()) {
			this.sessions.delete(matrixUserId);
			return null;
		}

		return session;
	}

	/**
	 * Get email for a logged-in Matrix user
	 */
	async getEmail(matrixUserId: string): Promise<string | null> {
		const session = await this.getSession(matrixUserId);
		return session?.email || null;
	}

	/**
	 * Store custom data in a user's session
	 */
	async setSessionData(matrixUserId: string, key: string, value: unknown): Promise<void> {
		// Update in Redis
		if (this.useRedis()) {
			await this.redisProvider!.updateSessionData(matrixUserId, key, value);
		}

		// Update in memory
		const session = this.sessions.get(matrixUserId);
		if (session) {
			session.data = session.data || {};
			session.data[key] = value;
		}
	}

	/**
	 * Get custom data from a user's session
	 */
	async getSessionData<T = unknown>(matrixUserId: string, key: string): Promise<T | null> {
		// Try Redis first
		if (this.useRedis()) {
			const data = await this.redisProvider!.getSessionData<T>(matrixUserId, key);
			if (data !== null) return data;
		}

		// Try memory
		const session = await this.getSession(matrixUserId);
		return (session?.data?.[key] as T) || null;
	}

	/**
	 * Get total session count (including expired in memory)
	 */
	getSessionCount(): number {
		return this.sessions.size;
	}

	/**
	 * Get count of active (non-expired) sessions
	 */
	async getActiveSessionCount(): Promise<number> {
		let count = 0;

		// Count Redis sessions
		if (this.useRedis()) {
			count = await this.redisProvider!.getActiveSessionCount();
		}

		// If not using Redis, count memory sessions
		if (count === 0) {
			const now = new Date();
			for (const session of this.sessions.values()) {
				if (session.expiresAt > now) count++;
			}
		}

		return count;
	}

	/**
	 * Get session statistics
	 */
	async getStats(): Promise<SessionStats> {
		const active = await this.getActiveSessionCount();
		return {
			total: this.getSessionCount(),
			active,
			storageMode: this.useRedis() ? 'redis' : 'memory',
			matrixSsoLinkEnabled: this.enableMatrixSsoLink,
		};
	}

	/**
	 * Clean up expired sessions (only for in-memory, Redis auto-expires)
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
	 * Get all active session user IDs (memory only)
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

	/**
	 * Health check
	 */
	async healthCheck(): Promise<{
		redis: { status: string; latency: number } | null;
		memory: number;
	}> {
		const redisHealth = this.redisProvider ? await this.redisProvider.healthCheck() : null;
		return {
			redis: redisHealth,
			memory: this.sessions.size,
		};
	}
}
