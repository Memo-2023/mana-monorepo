import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../database/database.module';
import { telegramUsers, botSettings, TelegramUser, NewTelegramUser, BotSetting } from '../database/schema';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(@Inject(DATABASE_CONNECTION) private db: Database | null) {}

	async getUserByTelegramId(telegramUserId: number): Promise<TelegramUser | null> {
		if (!this.db) return null;

		try {
			const result = await this.db
				.select()
				.from(telegramUsers)
				.where(eq(telegramUsers.telegramUserId, telegramUserId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error(`Error getting user: ${error}`);
			return null;
		}
	}

	async linkUser(data: {
		telegramUserId: number;
		telegramUsername?: string;
		telegramFirstName?: string;
		manaUserId: string;
		accessToken: string;
		refreshToken?: string;
		tokenExpiresAt?: Date;
	}): Promise<TelegramUser | null> {
		if (!this.db) return null;

		try {
			const existing = await this.getUserByTelegramId(data.telegramUserId);

			if (existing) {
				const result = await this.db
					.update(telegramUsers)
					.set({
						telegramUsername: data.telegramUsername,
						telegramFirstName: data.telegramFirstName,
						manaUserId: data.manaUserId,
						accessToken: data.accessToken,
						refreshToken: data.refreshToken,
						tokenExpiresAt: data.tokenExpiresAt,
						isActive: true,
						updatedAt: new Date(),
					})
					.where(eq(telegramUsers.telegramUserId, data.telegramUserId))
					.returning();

				return result[0] || null;
			} else {
				const newUser: NewTelegramUser = {
					telegramUserId: data.telegramUserId,
					telegramUsername: data.telegramUsername,
					telegramFirstName: data.telegramFirstName,
					manaUserId: data.manaUserId,
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
					tokenExpiresAt: data.tokenExpiresAt,
				};

				const result = await this.db.insert(telegramUsers).values(newUser).returning();

				// Create default bot settings
				if (result[0]) {
					await this.db.insert(botSettings).values({
						telegramUserId: data.telegramUserId,
					});
				}

				return result[0] || null;
			}
		} catch (error) {
			this.logger.error(`Error linking user: ${error}`);
			return null;
		}
	}

	async unlinkUser(telegramUserId: number): Promise<boolean> {
		if (!this.db) return false;

		try {
			await this.db
				.update(telegramUsers)
				.set({
					isActive: false,
					accessToken: null,
					refreshToken: null,
					updatedAt: new Date(),
				})
				.where(eq(telegramUsers.telegramUserId, telegramUserId));

			return true;
		} catch (error) {
			this.logger.error(`Error unlinking user: ${error}`);
			return false;
		}
	}

	async updateLastActive(telegramUserId: number): Promise<void> {
		if (!this.db) return;

		try {
			await this.db
				.update(telegramUsers)
				.set({ lastActiveAt: new Date() })
				.where(eq(telegramUsers.telegramUserId, telegramUserId));
		} catch (error) {
			this.logger.error(`Error updating last active: ${error}`);
		}
	}

	async getBotSettings(telegramUserId: number): Promise<BotSetting | null> {
		if (!this.db) return null;

		try {
			const result = await this.db
				.select()
				.from(botSettings)
				.where(eq(botSettings.telegramUserId, telegramUserId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error(`Error getting bot settings: ${error}`);
			return null;
		}
	}

	async getAllActiveUsers(): Promise<TelegramUser[]> {
		if (!this.db) return [];

		try {
			return await this.db.select().from(telegramUsers).where(eq(telegramUsers.isActive, true));
		} catch (error) {
			this.logger.error(`Error getting active users: ${error}`);
			return [];
		}
	}

	async getUsersWithBirthdayReminders(): Promise<
		Array<{ user: TelegramUser; settings: BotSetting }>
	> {
		if (!this.db) return [];

		try {
			const result = await this.db
				.select({
					user: telegramUsers,
					settings: botSettings,
				})
				.from(telegramUsers)
				.innerJoin(botSettings, eq(telegramUsers.telegramUserId, botSettings.telegramUserId))
				.where(eq(telegramUsers.isActive, true));

			return result.filter((r) => r.settings.birthdayRemindersEnabled);
		} catch (error) {
			this.logger.error(`Error getting users with birthday reminders: ${error}`);
			return [];
		}
	}
}
