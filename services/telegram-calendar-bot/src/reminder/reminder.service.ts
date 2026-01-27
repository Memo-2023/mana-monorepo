import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, gte, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION, Database } from '../database/database.module';
import { sentReminders, NewSentReminder, SentReminder } from '../database/schema';

@Injectable()
export class ReminderService {
	private readonly logger = new Logger(ReminderService.name);

	constructor(@Inject(DATABASE_CONNECTION) private db: Database | null) {}

	/**
	 * Check if a reminder was already sent
	 */
	async wasReminderSent(
		telegramUserId: number,
		eventId: string,
		reminderType: string,
		minutesBefore?: number,
		eventInstanceDate?: Date
	): Promise<boolean> {
		if (!this.db) return false;

		try {
			// Look for sent reminders in the last 24 hours to avoid duplicates
			const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

			const result = await this.db
				.select()
				.from(sentReminders)
				.where(
					and(
						eq(sentReminders.telegramUserId, telegramUserId),
						eq(sentReminders.eventId, eventId),
						eq(sentReminders.reminderType, reminderType),
						gte(sentReminders.sentAt, oneDayAgo)
					)
				)
				.limit(1);

			return result.length > 0;
		} catch (error) {
			this.logger.error(`Error checking sent reminder: ${error}`);
			return false;
		}
	}

	/**
	 * Record a sent reminder
	 */
	async recordSentReminder(data: {
		telegramUserId: number;
		eventId: string;
		reminderType: string;
		minutesBefore?: number;
		eventInstanceDate?: Date;
		messageId?: number;
	}): Promise<SentReminder | null> {
		if (!this.db) return null;

		try {
			const newReminder: NewSentReminder = {
				telegramUserId: data.telegramUserId,
				eventId: data.eventId,
				reminderType: data.reminderType,
				minutesBefore: data.minutesBefore,
				eventInstanceDate: data.eventInstanceDate,
				messageId: data.messageId,
			};

			const result = await this.db.insert(sentReminders).values(newReminder).returning();

			return result[0] || null;
		} catch (error) {
			this.logger.error(`Error recording sent reminder: ${error}`);
			return null;
		}
	}

	/**
	 * Clean up old sent reminders (older than 7 days)
	 */
	async cleanupOldReminders(): Promise<number> {
		if (!this.db) return 0;

		try {
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

			const result = await this.db
				.delete(sentReminders)
				.where(lte(sentReminders.sentAt, sevenDaysAgo));

			// Drizzle doesn't return count directly, so we estimate
			this.logger.log('Cleaned up old sent reminders');
			return 0;
		} catch (error) {
			this.logger.error(`Error cleaning up old reminders: ${error}`);
			return 0;
		}
	}
}
