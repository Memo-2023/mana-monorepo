import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { reminders } from '../db/schema/reminders.schema';
import type { Reminder, NewReminder } from '../db/schema/reminders.schema';
import { events } from '../db/schema/events.schema';
import { EventService } from '../event/event.service';
import { EmailService } from '../email/email.service';
import { NotificationService } from '../notification/notification.service';
import { CreateReminderDto } from './dto';

@Injectable()
export class ReminderService {
	private readonly logger = new Logger(ReminderService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private eventService: EventService,
		private emailService: EmailService,
		private notificationService: NotificationService
	) {}

	async findByEvent(eventId: string, userId: string): Promise<Reminder[]> {
		// Verify user owns the event
		await this.eventService.findByIdOrThrow(eventId, userId);

		return this.db
			.select()
			.from(reminders)
			.where(and(eq(reminders.eventId, eventId), eq(reminders.userId, userId)));
	}

	async findById(id: string, userId: string): Promise<Reminder | null> {
		const result = await this.db
			.select()
			.from(reminders)
			.where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
		return result[0] || null;
	}

	async create(userId: string, userEmail: string, dto: CreateReminderDto): Promise<Reminder> {
		// Verify user owns the event and get event details
		const event = await this.eventService.findByIdOrThrow(dto.eventId, userId);

		// Calculate reminder time
		const eventStartTime = new Date(event.startTime);
		const reminderTime = new Date(eventStartTime.getTime() - dto.minutesBefore * 60 * 1000);

		const newReminder: NewReminder = {
			eventId: dto.eventId,
			userId,
			userEmail,
			minutesBefore: dto.minutesBefore,
			reminderTime,
			notifyPush: dto.notifyPush ?? true,
			notifyEmail: dto.notifyEmail ?? false,
			status: 'pending',
		};

		const [created] = await this.db.insert(reminders).values(newReminder).returning();
		return created;
	}

	async delete(id: string, userId: string): Promise<void> {
		const reminder = await this.findById(id, userId);
		if (!reminder) {
			throw new NotFoundException(`Reminder with id ${id} not found`);
		}

		await this.db.delete(reminders).where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
	}

	async getPendingReminders(): Promise<Reminder[]> {
		const now = new Date();
		// Get reminders that are due within the next minute
		const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

		return this.db
			.select()
			.from(reminders)
			.where(and(eq(reminders.status, 'pending'), lte(reminders.reminderTime, oneMinuteFromNow)));
	}

	async markAsSent(id: string): Promise<void> {
		await this.db
			.update(reminders)
			.set({ status: 'sent', sentAt: new Date() })
			.where(eq(reminders.id, id));
	}

	async markAsFailed(id: string, error: string): Promise<void> {
		await this.db.update(reminders).set({ status: 'failed' }).where(eq(reminders.id, id));
		this.logger.error(`Reminder ${id} failed: ${error}`);
	}

	/**
	 * Process pending reminders every minute
	 * Sends push notifications and emails based on reminder settings
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async processReminders() {
		const pendingReminders = await this.getPendingReminders();

		if (pendingReminders.length === 0) {
			return;
		}

		this.logger.log(`Processing ${pendingReminders.length} pending reminders`);

		for (const reminder of pendingReminders) {
			try {
				// Get event details for the notification
				const eventResult = await this.db
					.select()
					.from(events)
					.where(eq(events.id, reminder.eventId));

				if (eventResult.length === 0) {
					await this.markAsFailed(reminder.id, 'Event not found');
					continue;
				}

				const event = eventResult[0];
				let pushSent = false;
				let emailSent = false;

				// Send push notification
				if (reminder.notifyPush) {
					try {
						pushSent = await this.notificationService.sendToUser(reminder.userId, {
							title: `Erinnerung: ${event.title}`,
							body: this.formatReminderBody(event.title, reminder.minutesBefore),
							data: {
								type: 'reminder',
								eventId: event.id,
								reminderId: reminder.id,
							},
						});

						if (pushSent) {
							this.logger.log(`Push notification sent for reminder ${reminder.id}`);
						}
					} catch (error) {
						this.logger.error(`Push notification failed for reminder ${reminder.id}:`, error);
					}
				}

				// Send email notification
				if (reminder.notifyEmail && reminder.userEmail) {
					try {
						emailSent = await this.emailService.sendReminderEmail(
							reminder.userEmail,
							event.title,
							new Date(event.startTime),
							reminder.minutesBefore
						);

						if (emailSent) {
							this.logger.log(`Email sent for reminder ${reminder.id}`);
						}
					} catch (error) {
						this.logger.error(`Email notification failed for reminder ${reminder.id}:`, error);
					}
				}

				// Mark as sent if at least one notification was attempted
				// (even if user has no push tokens, we consider it "sent" for push-only reminders)
				if (!reminder.notifyPush || pushSent || !reminder.notifyEmail || emailSent) {
					await this.markAsSent(reminder.id);
				} else {
					await this.markAsFailed(reminder.id, 'All notification channels failed');
				}
			} catch (error) {
				await this.markAsFailed(reminder.id, (error as Error).message);
			}
		}
	}

	/**
	 * Update reminders when an event is updated
	 */
	async updateRemindersForEvent(eventId: string, newStartTime: Date): Promise<void> {
		const eventReminders = await this.db
			.select()
			.from(reminders)
			.where(and(eq(reminders.eventId, eventId), eq(reminders.status, 'pending')));

		for (const reminder of eventReminders) {
			const newReminderTime = new Date(newStartTime.getTime() - reminder.minutesBefore * 60 * 1000);

			await this.db
				.update(reminders)
				.set({ reminderTime: newReminderTime })
				.where(eq(reminders.id, reminder.id));
		}
	}

	private formatReminderBody(eventTitle: string, minutesBefore: number): string {
		if (minutesBefore === 0) {
			return `"${eventTitle}" beginnt jetzt`;
		}
		if (minutesBefore < 60) {
			return `"${eventTitle}" beginnt in ${minutesBefore} Minuten`;
		}
		if (minutesBefore < 1440) {
			const hours = Math.round(minutesBefore / 60);
			return `"${eventTitle}" beginnt in ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
		}
		const days = Math.round(minutesBefore / 1440);
		return `"${eventTitle}" beginnt in ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;
	}
}
