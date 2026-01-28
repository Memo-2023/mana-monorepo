import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../database/database.module';
import {
	telegramUsers,
	chatBotSettings,
	TelegramUser,
	NewTelegramUser,
	ChatBotSettings,
} from '../database/schema';

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

	async getUserSettings(telegramUserId: number): Promise<ChatBotSettings | null> {
		if (!this.db) return null;

		try {
			const result = await this.db
				.select()
				.from(chatBotSettings)
				.where(eq(chatBotSettings.telegramUserId, telegramUserId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error(`Error getting user settings: ${error}`);
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

				// Create default settings
				if (result[0]) {
					await this.db.insert(chatBotSettings).values({
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

	async updateUserSettings(
		telegramUserId: number,
		settings: Partial<{
			currentModel: string | null;
			currentConversationId: string | null;
		}>
	): Promise<ChatBotSettings | null> {
		if (!this.db) return null;

		try {
			// Check if settings exist
			const existing = await this.getUserSettings(telegramUserId);

			if (existing) {
				const result = await this.db
					.update(chatBotSettings)
					.set({
						...settings,
						updatedAt: new Date(),
					})
					.where(eq(chatBotSettings.telegramUserId, telegramUserId))
					.returning();

				return result[0] || null;
			} else {
				// Create settings
				const result = await this.db
					.insert(chatBotSettings)
					.values({
						telegramUserId,
						currentModel: settings.currentModel,
						currentConversationId: settings.currentConversationId,
					})
					.returning();

				return result[0] || null;
			}
		} catch (error) {
			this.logger.error(`Error updating user settings: ${error}`);
			return null;
		}
	}
}
