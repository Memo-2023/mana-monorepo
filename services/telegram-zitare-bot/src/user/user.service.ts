import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { TelegramUser, UserFavorite } from '../database/schema';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(
		@Inject(DATABASE_CONNECTION)
		private readonly db: PostgresJsDatabase<typeof schema>
	) {}

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

	async addFavorite(telegramUserId: number, quoteId: string): Promise<boolean> {
		try {
			await this.db.insert(schema.userFavorites).values({
				telegramUserId,
				quoteId,
			});
			return true;
		} catch (error) {
			// Unique constraint violation = already favorited
			if ((error as { code?: string }).code === '23505') {
				return false;
			}
			throw error;
		}
	}

	async removeFavorite(telegramUserId: number, quoteId: string): Promise<boolean> {
		const result = await this.db
			.delete(schema.userFavorites)
			.where(
				and(
					eq(schema.userFavorites.telegramUserId, telegramUserId),
					eq(schema.userFavorites.quoteId, quoteId)
				)
			)
			.returning();

		return result.length > 0;
	}

	async getFavorites(telegramUserId: number): Promise<UserFavorite[]> {
		return this.db.query.userFavorites.findMany({
			where: eq(schema.userFavorites.telegramUserId, telegramUserId),
			orderBy: (favorites, { desc }) => [desc(favorites.createdAt)],
		});
	}

	async getFavoriteQuoteIds(telegramUserId: number): Promise<string[]> {
		const favorites = await this.getFavorites(telegramUserId);
		return favorites.map((f) => f.quoteId);
	}

	async isFavorite(telegramUserId: number, quoteId: string): Promise<boolean> {
		const favorite = await this.db.query.userFavorites.findFirst({
			where: and(
				eq(schema.userFavorites.telegramUserId, telegramUserId),
				eq(schema.userFavorites.quoteId, quoteId)
			),
		});
		return !!favorite;
	}

	async toggleDaily(telegramUserId: number): Promise<boolean> {
		const user = await this.db.query.telegramUsers.findFirst({
			where: eq(schema.telegramUsers.telegramUserId, telegramUserId),
		});

		if (!user) {
			return false;
		}

		const newValue = !user.dailyEnabled;
		await this.db
			.update(schema.telegramUsers)
			.set({ dailyEnabled: newValue, updatedAt: new Date() })
			.where(eq(schema.telegramUsers.id, user.id));

		return newValue;
	}

	async setDailyTime(telegramUserId: number, time: string): Promise<void> {
		await this.db
			.update(schema.telegramUsers)
			.set({ dailyTime: time, updatedAt: new Date() })
			.where(eq(schema.telegramUsers.telegramUserId, telegramUserId));
	}

	async getUsersWithDailyEnabled(): Promise<TelegramUser[]> {
		return this.db.query.telegramUsers.findMany({
			where: eq(schema.telegramUsers.dailyEnabled, true),
		});
	}

	async getDailySettings(
		telegramUserId: number
	): Promise<{ enabled: boolean; time: string } | null> {
		const user = await this.db.query.telegramUsers.findFirst({
			where: eq(schema.telegramUsers.telegramUserId, telegramUserId),
		});

		if (!user) {
			return null;
		}

		return {
			enabled: user.dailyEnabled,
			time: user.dailyTime,
		};
	}
}
