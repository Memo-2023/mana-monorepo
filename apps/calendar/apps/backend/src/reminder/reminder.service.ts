import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { eq, and, lte } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { reminders, type Reminder, type NewReminder } from '../db/schema/reminders.schema';
import { events } from '../db/schema/events.schema';
import { EventService } from '../event/event.service';
import { CreateReminderDto } from './dto';

@Injectable()
export class ReminderService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private eventService: EventService
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

	async create(userId: string, dto: CreateReminderDto): Promise<Reminder> {
		// Verify user owns the event and get event details
		const event = await this.eventService.findByIdOrThrow(dto.eventId, userId);

		// Calculate reminder time
		const eventStartTime = new Date(event.startTime);
		const reminderTime = new Date(eventStartTime.getTime() - dto.minutesBefore * 60 * 1000);

		const newReminder: NewReminder = {
			eventId: dto.eventId,
			userId,
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

		await this.db
			.delete(reminders)
			.where(and(eq(reminders.id, id), eq(reminders.userId, userId)));
	}

	async getPendingReminders(): Promise<Reminder[]> {
		const now = new Date();
		// Get reminders that are due within the next minute
		const oneMinuteFromNow = new Date(now.getTime() + 60 * 1000);

		return this.db
			.select()
			.from(reminders)
			.where(
				and(eq(reminders.status, 'pending'), lte(reminders.reminderTime, oneMinuteFromNow))
			);
	}

	async markAsSent(id: string): Promise<void> {
		await this.db
			.update(reminders)
			.set({ status: 'sent', sentAt: new Date() })
			.where(eq(reminders.id, id));
	}

	async markAsFailed(id: string, error: string): Promise<void> {
		await this.db.update(reminders).set({ status: 'failed' }).where(eq(reminders.id, id));
		console.error(`Reminder ${id} failed:`, error);
	}

	/**
	 * Process pending reminders every minute
	 * In production, this would send push notifications and emails
	 */
	@Cron(CronExpression.EVERY_MINUTE)
	async processReminders() {
		const pendingReminders = await this.getPendingReminders();

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

				// TODO: Implement actual notification sending
				// For now, just log and mark as sent
				console.log(`[Reminder] Event "${event.title}" starting in ${reminder.minutesBefore} minutes`);

				if (reminder.notifyPush) {
					// TODO: Send push notification via Expo Push API
					console.log(`  - Would send push notification to user ${reminder.userId}`);
				}

				if (reminder.notifyEmail) {
					// TODO: Send email notification
					console.log(`  - Would send email to user ${reminder.userId}`);
				}

				await this.markAsSent(reminder.id);
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
			const newReminderTime = new Date(
				newStartTime.getTime() - reminder.minutesBefore * 60 * 1000
			);

			await this.db
				.update(reminders)
				.set({ reminderTime: newReminderTime })
				.where(eq(reminders.id, reminder.id));
		}
	}
}
