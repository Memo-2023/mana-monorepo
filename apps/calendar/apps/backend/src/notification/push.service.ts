import { Injectable, Logger } from '@nestjs/common';
import Expo, { ExpoPushMessage, ExpoPushTicket, ExpoPushReceipt } from 'expo-server-sdk';

export interface PushNotification {
	title: string;
	body: string;
	data?: Record<string, unknown>;
	sound?: 'default' | null;
	badge?: number;
}

@Injectable()
export class PushService {
	private readonly logger = new Logger(PushService.name);
	private expo: Expo;

	constructor() {
		this.expo = new Expo();
	}

	/**
	 * Validate if a token is a valid Expo push token
	 */
	isValidToken(token: string): boolean {
		return Expo.isExpoPushToken(token);
	}

	/**
	 * Send push notification to a single token
	 */
	async sendToToken(token: string, notification: PushNotification): Promise<boolean> {
		if (!this.isValidToken(token)) {
			this.logger.warn(`Invalid Expo push token: ${token}`);
			return false;
		}

		const message: ExpoPushMessage = {
			to: token,
			title: notification.title,
			body: notification.body,
			data: notification.data,
			sound: notification.sound ?? 'default',
			badge: notification.badge,
		};

		try {
			const tickets = await this.expo.sendPushNotificationsAsync([message]);
			const ticket = tickets[0];

			if (ticket.status === 'error') {
				this.logger.error(`Push notification error: ${ticket.message}`, ticket.details);
				return false;
			}

			this.logger.log(`Push notification sent successfully to token: ${token.substring(0, 30)}...`);
			return true;
		} catch (error) {
			this.logger.error('Failed to send push notification:', error);
			return false;
		}
	}

	/**
	 * Send push notification to multiple tokens
	 */
	async sendToTokens(
		tokens: string[],
		notification: PushNotification
	): Promise<Map<string, boolean>> {
		const results = new Map<string, boolean>();
		const validTokens = tokens.filter((token) => {
			const isValid = this.isValidToken(token);
			if (!isValid) {
				this.logger.warn(`Skipping invalid token: ${token}`);
				results.set(token, false);
			}
			return isValid;
		});

		if (validTokens.length === 0) {
			return results;
		}

		const messages: ExpoPushMessage[] = validTokens.map((token) => ({
			to: token,
			title: notification.title,
			body: notification.body,
			data: notification.data,
			sound: notification.sound ?? 'default',
			badge: notification.badge,
		}));

		// Chunk messages (Expo has a limit of 100 per batch)
		const chunks = this.expo.chunkPushNotifications(messages);

		for (const chunk of chunks) {
			try {
				const tickets = await this.expo.sendPushNotificationsAsync(chunk);

				tickets.forEach((ticket, index) => {
					const token = (chunk[index] as ExpoPushMessage).to as string;
					if (ticket.status === 'ok') {
						results.set(token, true);
					} else {
						this.logger.error(`Push error for ${token}: ${ticket.message}`);
						results.set(token, false);
					}
				});
			} catch (error) {
				this.logger.error('Failed to send push notification batch:', error);
				chunk.forEach((msg) => {
					results.set(msg.to as string, false);
				});
			}
		}

		const successCount = Array.from(results.values()).filter((v) => v).length;
		this.logger.log(`Push notifications sent: ${successCount}/${tokens.length} successful`);

		return results;
	}

	/**
	 * Check receipts for sent notifications
	 * Call this after some time to verify delivery
	 */
	async checkReceipts(ticketIds: string[]): Promise<Map<string, ExpoPushReceipt>> {
		const results = new Map<string, ExpoPushReceipt>();
		const chunks = this.expo.chunkPushNotificationReceiptIds(ticketIds);

		for (const chunk of chunks) {
			try {
				const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);

				for (const [id, receipt] of Object.entries(receipts)) {
					results.set(id, receipt);

					if (receipt.status === 'error') {
						this.logger.error(`Receipt error for ${id}: ${receipt.message}`, receipt.details);
					}
				}
			} catch (error) {
				this.logger.error('Failed to get push notification receipts:', error);
			}
		}

		return results;
	}
}
