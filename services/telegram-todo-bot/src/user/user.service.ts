import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { TelegramUser } from '../database/schema';

interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	user: {
		id: string;
		email: string;
	};
}

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);
	private readonly authUrl: string;

	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: PostgresJsDatabase<typeof schema>,
		private readonly configService: ConfigService
	) {
		this.authUrl = this.configService.get<string>('manaCore.authUrl') || 'http://localhost:3001';
	}

	async ensureUser(telegramUserId: number, username?: string): Promise<TelegramUser> {
		// Try to find existing user
		const existing = await this.db.query.telegramUsers.findFirst({
			where: eq(schema.telegramUsers.telegramUserId, telegramUserId),
		});

		if (existing) {
			// Update username if changed
			if (username && existing.telegramUsername !== username) {
				await this.db
					.update(schema.telegramUsers)
					.set({ telegramUsername: username, updatedAt: new Date() })
					.where(eq(schema.telegramUsers.id, existing.id));
			}
			return existing;
		}

		// Create new user
		const [newUser] = await this.db
			.insert(schema.telegramUsers)
			.values({
				telegramUserId,
				telegramUsername: username,
			})
			.returning();

		this.logger.log(`Created new user: ${telegramUserId} (@${username})`);
		return newUser;
	}

	async getLinkedUser(telegramUserId: number): Promise<TelegramUser | null> {
		const user = await this.db.query.telegramUsers.findFirst({
			where: eq(schema.telegramUsers.telegramUserId, telegramUserId),
		});

		if (!user || !user.accessToken) {
			return null;
		}

		// Check if token is expired
		if (user.tokenExpiresAt && user.tokenExpiresAt < new Date()) {
			// Try to refresh the token
			if (user.refreshToken) {
				const refreshed = await this.refreshAccessToken(user);
				if (refreshed) {
					return refreshed;
				}
			}
			return null;
		}

		return user;
	}

	async linkAccount(
		telegramUserId: number,
		email: string,
		password: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			// Authenticate with mana-core-auth
			const response = await fetch(`${this.authUrl}/api/v1/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!response.ok) {
				const error = await response.text();
				this.logger.warn(`Login failed for telegram user ${telegramUserId}: ${error}`);
				return { success: false, error: 'Anmeldung fehlgeschlagen. Bitte Zugangsdaten pruefen.' };
			}

			const data = (await response.json()) as AuthResponse;

			// Calculate token expiry (15 minutes from now, or parse from JWT)
			const tokenExpiresAt = new Date();
			tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 14); // 14 min to be safe

			// Update the user with tokens
			await this.db
				.update(schema.telegramUsers)
				.set({
					manaUserId: data.user.id,
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
					tokenExpiresAt,
					updatedAt: new Date(),
				})
				.where(eq(schema.telegramUsers.telegramUserId, telegramUserId));

			this.logger.log(`Linked telegram user ${telegramUserId} to mana user ${data.user.id}`);
			return { success: true };
		} catch (error) {
			this.logger.error(`Failed to link account: ${error}`);
			return { success: false, error: 'Verbindungsfehler. Bitte spaeter erneut versuchen.' };
		}
	}

	async unlinkAccount(telegramUserId: number): Promise<void> {
		await this.db
			.update(schema.telegramUsers)
			.set({
				manaUserId: null,
				accessToken: null,
				refreshToken: null,
				tokenExpiresAt: null,
				updatedAt: new Date(),
			})
			.where(eq(schema.telegramUsers.telegramUserId, telegramUserId));
	}

	private async refreshAccessToken(user: TelegramUser): Promise<TelegramUser | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/auth/refresh`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ refreshToken: user.refreshToken }),
			});

			if (!response.ok) {
				this.logger.warn(`Token refresh failed for user ${user.telegramUserId}`);
				return null;
			}

			const data = (await response.json()) as AuthResponse;

			const tokenExpiresAt = new Date();
			tokenExpiresAt.setMinutes(tokenExpiresAt.getMinutes() + 14);

			const [updated] = await this.db
				.update(schema.telegramUsers)
				.set({
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
					tokenExpiresAt,
					updatedAt: new Date(),
				})
				.where(eq(schema.telegramUsers.id, user.id))
				.returning();

			return updated;
		} catch (error) {
			this.logger.error(`Token refresh error: ${error}`);
			return null;
		}
	}

	async toggleDailyReminder(telegramUserId: number): Promise<boolean> {
		const user = await this.db.query.telegramUsers.findFirst({
			where: eq(schema.telegramUsers.telegramUserId, telegramUserId),
		});

		if (!user) {
			return false;
		}

		const newValue = !user.dailyReminderEnabled;
		await this.db
			.update(schema.telegramUsers)
			.set({ dailyReminderEnabled: newValue, updatedAt: new Date() })
			.where(eq(schema.telegramUsers.id, user.id));

		return newValue;
	}

	async setDailyReminderTime(telegramUserId: number, time: string): Promise<void> {
		await this.db
			.update(schema.telegramUsers)
			.set({ dailyReminderTime: time, updatedAt: new Date() })
			.where(eq(schema.telegramUsers.telegramUserId, telegramUserId));
	}

	async getUsersWithDailyReminderEnabled(): Promise<TelegramUser[]> {
		return this.db.query.telegramUsers.findMany({
			where: eq(schema.telegramUsers.dailyReminderEnabled, true),
		});
	}

	async getDailyReminderSettings(
		telegramUserId: number
	): Promise<{ enabled: boolean; time: string } | null> {
		const user = await this.db.query.telegramUsers.findFirst({
			where: eq(schema.telegramUsers.telegramUserId, telegramUserId),
		});

		if (!user) {
			return null;
		}

		return {
			enabled: user.dailyReminderEnabled,
			time: user.dailyReminderTime,
		};
	}
}
