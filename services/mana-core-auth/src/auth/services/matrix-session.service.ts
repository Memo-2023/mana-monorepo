import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { getDb } from '../../db/connection';
import { matrixUserLinks, users } from '../../db/schema/auth.schema';
import { BetterAuthService } from './better-auth.service';

/**
 * Matrix Session Service
 *
 * Manages the link between Matrix user IDs and Mana Core Auth accounts.
 * Enables automatic bot authentication for users who have linked their accounts.
 *
 * Flow:
 * 1. User logs into a Matrix bot via !login email password
 * 2. Bot calls POST /api/v1/auth/matrix-user-links to store the link
 * 3. Later, bot can call GET /api/v1/auth/matrix-session/:matrixUserId
 * 4. If a link exists, a fresh JWT token is returned
 */
@Injectable()
export class MatrixSessionService {
	private readonly logger = new Logger(MatrixSessionService.name);
	private readonly db;
	private readonly serviceKey: string;

	constructor(
		private readonly configService: ConfigService,
		private readonly betterAuthService: BetterAuthService
	) {
		const databaseUrl = this.configService.get<string>('DATABASE_URL');
		if (!databaseUrl) {
			throw new Error('DATABASE_URL is required');
		}
		this.db = getDb(databaseUrl);
		this.serviceKey = this.configService.get<string>('MANA_CORE_SERVICE_KEY', '');
	}

	/**
	 * Validate service key from X-Service-Key header
	 */
	validateServiceKey(providedKey: string): boolean {
		if (!this.serviceKey) {
			this.logger.warn('MANA_CORE_SERVICE_KEY not configured - service key validation disabled');
			return false;
		}
		return providedKey === this.serviceKey;
	}

	/**
	 * Create or update a link between a Matrix user ID and a Mana user
	 *
	 * @param matrixUserId - Matrix user ID (e.g., @user:matrix.mana.how)
	 * @param manaUserId - Mana Core Auth user ID
	 * @param email - User's email (optional, for convenience)
	 */
	async linkMatrixUser(matrixUserId: string, manaUserId: string, email?: string): Promise<void> {
		// Check if link already exists
		const existing = await this.db
			.select()
			.from(matrixUserLinks)
			.where(eq(matrixUserLinks.matrixUserId, matrixUserId))
			.limit(1);

		if (existing.length > 0) {
			// Update existing link
			await this.db
				.update(matrixUserLinks)
				.set({
					userId: manaUserId,
					email,
					lastUsedAt: new Date(),
				})
				.where(eq(matrixUserLinks.matrixUserId, matrixUserId));

			this.logger.log(`Updated Matrix link: ${matrixUserId} -> ${manaUserId}`);
		} else {
			// Create new link
			await this.db.insert(matrixUserLinks).values({
				id: nanoid(),
				matrixUserId,
				userId: manaUserId,
				email,
				linkedAt: new Date(),
			});

			this.logger.log(`Created Matrix link: ${matrixUserId} -> ${manaUserId}`);
		}
	}

	/**
	 * Remove a link for a Matrix user ID
	 */
	async unlinkMatrixUser(matrixUserId: string): Promise<boolean> {
		const result = await this.db
			.delete(matrixUserLinks)
			.where(eq(matrixUserLinks.matrixUserId, matrixUserId))
			.returning();

		if (result.length > 0) {
			this.logger.log(`Removed Matrix link: ${matrixUserId}`);
			return true;
		}
		return false;
	}

	/**
	 * Get a fresh JWT token for a linked Matrix user
	 *
	 * @param matrixUserId - Matrix user ID
	 * @returns JWT token or null if no link exists
	 */
	async getSessionForMatrixUser(
		matrixUserId: string
	): Promise<{ token: string; email: string } | null> {
		// Find the link
		const links = await this.db
			.select({
				userId: matrixUserLinks.userId,
				email: matrixUserLinks.email,
			})
			.from(matrixUserLinks)
			.where(eq(matrixUserLinks.matrixUserId, matrixUserId))
			.limit(1);

		if (links.length === 0) {
			return null;
		}

		const link = links[0];

		// Update last used timestamp
		await this.db
			.update(matrixUserLinks)
			.set({ lastUsedAt: new Date() })
			.where(eq(matrixUserLinks.matrixUserId, matrixUserId));

		// Get user details if email not stored
		let email = link.email;
		if (!email) {
			const userRecords = await this.db
				.select({ email: users.email })
				.from(users)
				.where(eq(users.id, link.userId))
				.limit(1);

			if (userRecords.length > 0) {
				email = userRecords[0].email;
			}
		}

		// Generate a fresh JWT token for this user
		const token = await this.betterAuthService.generateTokenForUser(link.userId);

		if (!token) {
			this.logger.error(`Failed to generate token for user ${link.userId}`);
			return null;
		}

		this.logger.debug(`Generated token for Matrix user ${matrixUserId}`);
		return { token, email: email || '' };
	}

	/**
	 * Get all Matrix links for a Mana user
	 */
	async getLinksForUser(manaUserId: string): Promise<{ matrixUserId: string; linkedAt: Date }[]> {
		const links = await this.db
			.select({
				matrixUserId: matrixUserLinks.matrixUserId,
				linkedAt: matrixUserLinks.linkedAt,
			})
			.from(matrixUserLinks)
			.where(eq(matrixUserLinks.userId, manaUserId));

		return links;
	}

	/**
	 * Check if a Matrix user is linked
	 */
	async isLinked(matrixUserId: string): Promise<boolean> {
		const links = await this.db
			.select({ id: matrixUserLinks.id })
			.from(matrixUserLinks)
			.where(eq(matrixUserLinks.matrixUserId, matrixUserId))
			.limit(1);

		return links.length > 0;
	}

	/**
	 * Auto-link Matrix user during OIDC login
	 *
	 * Called when a user logs into Matrix via OIDC (Sign in with Mana Core).
	 * Creates the Matrix user link automatically so bots can recognize them.
	 *
	 * @param manaUserId - Mana Core Auth user ID
	 * @param email - User's email address
	 * @param matrixDomain - Matrix homeserver domain (default: matrix.mana.how)
	 */
	async autoLinkOnOidcLogin(
		manaUserId: string,
		email: string,
		matrixDomain = 'matrix.mana.how'
	): Promise<void> {
		try {
			// Calculate Matrix user ID from email using Synapse's template:
			// localpart_template: "{{ user.email.split('@')[0] }}"
			const localpart = email.split('@')[0].toLowerCase();
			const matrixUserId = `@${localpart}:${matrixDomain}`;

			// Check if link already exists
			const existing = await this.db
				.select()
				.from(matrixUserLinks)
				.where(eq(matrixUserLinks.matrixUserId, matrixUserId))
				.limit(1);

			if (existing.length > 0) {
				// Update existing link (in case user ID changed)
				if (existing[0].userId !== manaUserId) {
					await this.db
						.update(matrixUserLinks)
						.set({
							userId: manaUserId,
							email,
							lastUsedAt: new Date(),
						})
						.where(eq(matrixUserLinks.matrixUserId, matrixUserId));
					this.logger.log(`Updated Matrix auto-link: ${matrixUserId} -> ${manaUserId}`);
				} else {
					// Just update lastUsedAt
					await this.db
						.update(matrixUserLinks)
						.set({ lastUsedAt: new Date() })
						.where(eq(matrixUserLinks.matrixUserId, matrixUserId));
				}
				return;
			}

			// Create new link
			await this.db.insert(matrixUserLinks).values({
				id: nanoid(),
				matrixUserId,
				userId: manaUserId,
				email,
				linkedAt: new Date(),
			});

			this.logger.log(`Created Matrix auto-link on OIDC login: ${matrixUserId} -> ${manaUserId}`);
		} catch (error) {
			// Log but don't throw - this is a best-effort operation
			this.logger.error(
				'Failed to auto-link Matrix user on OIDC login',
				error instanceof Error ? error.stack : undefined
			);
		}
	}
}
