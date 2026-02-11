import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import {
	UserDataResponse,
	DeleteUserDataResponse,
	EntityCount,
} from './dto/user-data-response.dto';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase<typeof schema>
	) {}

	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count calendars
		const calendarsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.calendars)
			.where(eq(schema.calendars.userId, userId));
		const calendarsCount = calendarsResult[0]?.count ?? 0;

		// Count events
		const eventsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.events)
			.where(eq(schema.events.userId, userId));
		const eventsCount = eventsResult[0]?.count ?? 0;

		// Count reminders
		const remindersResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.reminders)
			.where(eq(schema.reminders.userId, userId));
		const remindersCount = remindersResult[0]?.count ?? 0;

		// Count calendar shares (invited by user)
		const sharesResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.calendarShares)
			.where(eq(schema.calendarShares.invitedBy, userId));
		const sharesCount = sharesResult[0]?.count ?? 0;

		// Count external calendars
		const externalCalendarsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.externalCalendars)
			.where(eq(schema.externalCalendars.userId, userId));
		const externalCalendarsCount = externalCalendarsResult[0]?.count ?? 0;

		// Get last activity
		const lastEvent = await this.db
			.select({ updatedAt: schema.events.updatedAt })
			.from(schema.events)
			.where(eq(schema.events.userId, userId))
			.orderBy(desc(schema.events.updatedAt))
			.limit(1);
		const lastActivityAt = lastEvent[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'calendars', count: calendarsCount, label: 'Calendars' },
			{ entity: 'events', count: eventsCount, label: 'Events' },
			{ entity: 'reminders', count: remindersCount, label: 'Reminders' },
			{ entity: 'calendar_shares', count: sharesCount, label: 'Calendar Shares' },
			{ entity: 'external_calendars', count: externalCalendarsCount, label: 'External Calendars' },
		];

		const totalCount =
			calendarsCount + eventsCount + remindersCount + sharesCount + externalCalendarsCount;

		return { entities, totalCount, lastActivityAt };
	}

	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete reminders
		const deletedReminders = await this.db
			.delete(schema.reminders)
			.where(eq(schema.reminders.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'reminders', count: deletedReminders.length, label: 'Reminders' });
		totalDeleted += deletedReminders.length;

		// Delete calendar shares (where user invited)
		const deletedShares = await this.db
			.delete(schema.calendarShares)
			.where(eq(schema.calendarShares.invitedBy, userId))
			.returning();
		deletedCounts.push({
			entity: 'calendar_shares',
			count: deletedShares.length,
			label: 'Calendar Shares',
		});
		totalDeleted += deletedShares.length;

		// Delete events (cascades from calendars but also direct)
		const deletedEvents = await this.db
			.delete(schema.events)
			.where(eq(schema.events.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'events', count: deletedEvents.length, label: 'Events' });
		totalDeleted += deletedEvents.length;

		// Delete external calendars
		const deletedExternalCalendars = await this.db
			.delete(schema.externalCalendars)
			.where(eq(schema.externalCalendars.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'external_calendars',
			count: deletedExternalCalendars.length,
			label: 'External Calendars',
		});
		totalDeleted += deletedExternalCalendars.length;

		// Delete calendars
		const deletedCalendars = await this.db
			.delete(schema.calendars)
			.where(eq(schema.calendars.userId, userId))
			.returning();
		deletedCounts.push({ entity: 'calendars', count: deletedCalendars.length, label: 'Calendars' });
		totalDeleted += deletedCalendars.length;

		// Delete device tokens
		const deletedDeviceTokens = await this.db
			.delete(schema.deviceTokens)
			.where(eq(schema.deviceTokens.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'device_tokens',
			count: deletedDeviceTokens.length,
			label: 'Device Tokens',
		});
		totalDeleted += deletedDeviceTokens.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return { success: true, deletedCounts, totalDeleted };
	}
}
