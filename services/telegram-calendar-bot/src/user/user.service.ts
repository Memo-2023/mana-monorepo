import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../database/database.module';
import {
	telegramUsers,
	reminderSettings,
	TelegramUser,
	NewTelegramUser,
	ReminderSetting,
} from '../database/schema';

@Injectable()
export class UserService {
	private readonly logger = new Logger(UserService.name);

	constructor(@Inject(DATABASE_CONNECTION) private db: Database | null) {}

	/**
	 * Get user by Telegram ID
	 */
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

	/**
	 * Create or update a linked user
	 */
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
				// Update existing
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
				// Create new
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

				// Create default reminder settings
				if (result[0]) {
					await this.db.insert(reminderSettings).values({
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

	/**
	 * Unlink a user (deactivate)
	 */
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

	/**
	 * Update last active timestamp
	 */
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

	/**
	 * Get reminder settings for a user
	 */
	async getReminderSettings(telegramUserId: number): Promise<ReminderSetting | null> {
		if (!this.db) return null;

		try {
			const result = await this.db
				.select()
				.from(reminderSettings)
				.where(eq(reminderSettings.telegramUserId, telegramUserId))
				.limit(1);

			return result[0] || null;
		} catch (error) {
			this.logger.error(`Error getting reminder settings: ${error}`);
			return null;
		}
	}

	/**
	 * Update reminder settings
	 */
	async updateReminderSettings(
		telegramUserId: number,
		settings: Partial<{
			defaultReminderMinutes: number;
			morningBriefingEnabled: boolean;
			morningBriefingTime: string;
			timezone: string;
			notifyEventReminders: boolean;
			notifyEventChanges: boolean;
			notifySharedCalendars: boolean;
		}>
	): Promise<ReminderSetting | null> {
		if (!this.db) return null;

		try {
			const result = await this.db
				.update(reminderSettings)
				.set({
					...settings,
					updatedAt: new Date(),
				})
				.where(eq(reminderSettings.telegramUserId, telegramUserId))
				.returning();

			return result[0] || null;
		} catch (error) {
			this.logger.error(`Error updating reminder settings: ${error}`);
			return null;
		}
	}

	/**
	 * Get all active users (for reminder scheduler)
	 */
	async getAllActiveUsers(): Promise<TelegramUser[]> {
		if (!this.db) return [];

		try {
			return await this.db
				.select()
				.from(telegramUsers)
				.where(eq(telegramUsers.isActive, true));
		} catch (error) {
			this.logger.error(`Error getting active users: ${error}`);
			return [];
		}
	}

	/**
	 * Get users with morning briefing enabled
	 */
	async getUsersWithMorningBriefing(): Promise<
		Array<{ user: TelegramUser; settings: ReminderSetting }>
	> {
		if (!this.db) return [];

		try {
			const result = await this.db
				.select({
					user: telegramUsers,
					settings: reminderSettings,
				})
				.from(telegramUsers)
				.innerJoin(
					reminderSettings,
					eq(telegramUsers.telegramUserId, reminderSettings.telegramUserId)
				)
				.where(eq(telegramUsers.isActive, true));

			return result.filter((r) => r.settings.morningBriefingEnabled);
		} catch (error) {
			this.logger.error(`Error getting users with morning briefing: ${error}`);
			return [];
		}
	}
}
