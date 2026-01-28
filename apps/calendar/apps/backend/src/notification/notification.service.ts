import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import {
	deviceTokens,
	type DeviceToken,
	type NewDeviceToken,
} from '../db/schema/device-tokens.schema';
import { PushService, PushNotification } from './push.service';
import { RegisterTokenDto } from './dto';

@Injectable()
export class NotificationService {
	private readonly logger = new Logger(NotificationService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private pushService: PushService
	) {}

	/**
	 * Register or update a device token for a user
	 */
	async registerToken(userId: string, dto: RegisterTokenDto): Promise<DeviceToken> {
		const { pushToken, platform, deviceName } = dto;

		// Check if token already exists
		const existing = await this.db
			.select()
			.from(deviceTokens)
			.where(eq(deviceTokens.pushToken, pushToken));

		if (existing.length > 0) {
			// Update existing token (might be a different user now)
			const [updated] = await this.db
				.update(deviceTokens)
				.set({
					userId,
					platform,
					deviceName,
					isActive: true,
					updatedAt: new Date(),
				})
				.where(eq(deviceTokens.pushToken, pushToken))
				.returning();

			this.logger.log(`Updated device token for user ${userId}`);
			return updated;
		}

		// Create new token
		const newToken: NewDeviceToken = {
			userId,
			pushToken,
			platform,
			deviceName,
			isActive: true,
		};

		const [created] = await this.db.insert(deviceTokens).values(newToken).returning();
		this.logger.log(`Registered new device token for user ${userId}`);
		return created;
	}

	/**
	 * Remove a device token
	 */
	async removeToken(pushToken: string): Promise<void> {
		await this.db.delete(deviceTokens).where(eq(deviceTokens.pushToken, pushToken));
		this.logger.log(`Removed device token: ${pushToken.substring(0, 30)}...`);
	}

	/**
	 * Deactivate a token (soft delete)
	 */
	async deactivateToken(pushToken: string): Promise<void> {
		await this.db
			.update(deviceTokens)
			.set({ isActive: false, updatedAt: new Date() })
			.where(eq(deviceTokens.pushToken, pushToken));
	}

	/**
	 * Get all active tokens for a user
	 */
	async getActiveTokensForUser(userId: string): Promise<DeviceToken[]> {
		return this.db
			.select()
			.from(deviceTokens)
			.where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)));
	}

	/**
	 * Send push notification to a user's devices
	 */
	async sendToUser(userId: string, notification: PushNotification): Promise<boolean> {
		const tokens = await this.getActiveTokensForUser(userId);

		if (tokens.length === 0) {
			this.logger.debug(`No active push tokens for user ${userId}`);
			return false;
		}

		const pushTokens = tokens.map((t) => t.pushToken);
		const results = await this.pushService.sendToTokens(pushTokens, notification);

		// Deactivate tokens that failed (might be invalid/unregistered)
		for (const [token, success] of results.entries()) {
			if (!success) {
				await this.deactivateToken(token);
			}
		}

		return Array.from(results.values()).some((v) => v);
	}

	/**
	 * Get count of active tokens for a user
	 */
	async getTokenCount(userId: string): Promise<number> {
		const tokens = await this.getActiveTokensForUser(userId);
		return tokens.length;
	}
}
