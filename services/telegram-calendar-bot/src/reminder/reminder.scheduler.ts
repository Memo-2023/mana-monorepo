import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf, Context } from 'telegraf';
import { CalendarClient } from '../calendar/calendar.client';
import { UserService } from '../user/user.service';
import { ReminderService } from './reminder.service';
import { formatReminder, formatMorningBriefing } from '../bot/formatters';

@Injectable()
export class ReminderScheduler {
	private readonly logger = new Logger(ReminderScheduler.name);

	constructor(
		@InjectBot() private bot: Telegraf<Context>,
		private configService: ConfigService,
		private calendarClient: CalendarClient,
		private userService: UserService,
		private reminderService: ReminderService
	) {}

	/**
	 * Check for upcoming events and send reminders
	 * Runs every minute
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async checkReminders() {
		this.logger.debug('Checking for event reminders...');

		try {
			const users = await this.userService.getAllActiveUsers();

			for (const user of users) {
				if (!user.accessToken) continue;

				const settings = await this.userService.getReminderSettings(user.telegramUserId);
				if (!settings?.notifyEventReminders) continue;

				const reminderMinutes = settings.defaultReminderMinutes || 15;

				// Get events starting in the next reminderMinutes
				const events = await this.calendarClient.getUpcomingEventsForReminders(
					user.accessToken,
					reminderMinutes + 1 // Add 1 minute buffer
				);

				for (const event of events) {
					const eventStart = new Date(event.startTime);
					const now = new Date();
					const minutesUntilEvent = Math.floor(
						(eventStart.getTime() - now.getTime()) / (1000 * 60)
					);

					// Check if this is the right time to send reminder
					if (minutesUntilEvent <= reminderMinutes && minutesUntilEvent > reminderMinutes - 1) {
						// Check if we already sent this reminder
						const alreadySent = await this.reminderService.wasReminderSent(
							user.telegramUserId,
							event.id,
							'before_event',
							reminderMinutes
						);

						if (!alreadySent) {
							await this.sendReminder(user.telegramUserId, event, reminderMinutes);
						}
					}
				}
			}
		} catch (error) {
			this.logger.error(`Error checking reminders: ${error}`);
		}
	}

	/**
	 * Send morning briefing
	 * Runs at 7:00 AM (configurable via morning briefing time per user)
	 */
	@Cron('0 * * * *') // Run every hour, check user-specific times
	async sendMorningBriefings() {
		this.logger.debug('Checking for morning briefings...');

		try {
			const usersWithBriefing = await this.userService.getUsersWithMorningBriefing();
			const now = new Date();
			const currentHour = now.getHours();
			const currentMinute = now.getMinutes();

			for (const { user, settings } of usersWithBriefing) {
				if (!user.accessToken) continue;

				// Parse briefing time (HH:mm format)
				const [briefingHour, briefingMinute] = (settings.morningBriefingTime || '07:00')
					.split(':')
					.map(Number);

				// Check if it's the right hour (minute check is less precise due to cron)
				if (currentHour === briefingHour && currentMinute < 5) {
					// Check if we already sent today's briefing
					const today = new Date().toISOString().split('T')[0];
					const alreadySent = await this.reminderService.wasReminderSent(
						user.telegramUserId,
						`briefing-${today}`,
						'morning_briefing'
					);

					if (!alreadySent) {
						await this.sendBriefing(user.telegramUserId, user.accessToken);
					}
				}
			}
		} catch (error) {
			this.logger.error(`Error sending morning briefings: ${error}`);
		}
	}

	/**
	 * Cleanup old sent reminders
	 * Runs daily at 3:00 AM
	 */
	@Cron('0 3 * * *')
	async cleanupOldReminders() {
		this.logger.log('Cleaning up old sent reminders...');
		await this.reminderService.cleanupOldReminders();
	}

	/**
	 * Send a reminder notification
	 */
	private async sendReminder(
		telegramUserId: number,
		event: { id: string; title: string; startTime: string; endTime: string; location?: string; color?: string },
		minutesBefore: number
	) {
		try {
			const message = formatReminder(event as any, minutesBefore);
			const sent = await this.bot.telegram.sendMessage(telegramUserId, message, {
				parse_mode: 'HTML',
			});

			// Record that we sent this reminder
			await this.reminderService.recordSentReminder({
				telegramUserId,
				eventId: event.id,
				reminderType: 'before_event',
				minutesBefore,
				messageId: sent.message_id,
			});

			this.logger.log(`Sent reminder to ${telegramUserId} for event ${event.id}`);
		} catch (error) {
			this.logger.error(`Error sending reminder to ${telegramUserId}: ${error}`);
		}
	}

	/**
	 * Send morning briefing
	 */
	private async sendBriefing(telegramUserId: number, accessToken: string) {
		try {
			const events = await this.calendarClient.getTodayEvents(accessToken);
			const message = formatMorningBriefing(events);

			const sent = await this.bot.telegram.sendMessage(telegramUserId, message, {
				parse_mode: 'HTML',
			});

			// Record that we sent today's briefing
			const today = new Date().toISOString().split('T')[0];
			await this.reminderService.recordSentReminder({
				telegramUserId,
				eventId: `briefing-${today}`,
				reminderType: 'morning_briefing',
				messageId: sent.message_id,
			});

			this.logger.log(`Sent morning briefing to ${telegramUserId}`);
		} catch (error) {
			this.logger.error(`Error sending briefing to ${telegramUserId}: ${error}`);
		}
	}
}
