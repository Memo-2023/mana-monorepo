import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, sql, desc } from 'drizzle-orm';
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
		private readonly db: PostgresJsDatabase<typeof schema>
	) {}

	/**
	 * Get user data counts for a specific user
	 */
	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count alarms
		const alarmsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.alarms)
			.where(eq(schema.alarms.userId, userId));
		const alarmsCount = alarmsResult[0]?.count ?? 0;

		// Count timers
		const timersResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.timers)
			.where(eq(schema.timers.userId, userId));
		const timersCount = timersResult[0]?.count ?? 0;

		// Count world clocks
		const worldClocksResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.worldClocks)
			.where(eq(schema.worldClocks.userId, userId));
		const worldClocksCount = worldClocksResult[0]?.count ?? 0;

		// Count presets
		const presetsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.presets)
			.where(eq(schema.presets.userId, userId));
		const presetsCount = presetsResult[0]?.count ?? 0;

		// Get last activity (most recent alarm update)
		const lastAlarm = await this.db
			.select({ updatedAt: schema.alarms.updatedAt })
			.from(schema.alarms)
			.where(eq(schema.alarms.userId, userId))
			.orderBy(desc(schema.alarms.updatedAt))
			.limit(1);
		const lastActivityAt = lastAlarm[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'alarms', count: alarmsCount, label: 'Wecker' },
			{ entity: 'timers', count: timersCount, label: 'Timer' },
			{ entity: 'world_clocks', count: worldClocksCount, label: 'Weltuhren' },
			{ entity: 'presets', count: presetsCount, label: 'Vorlagen' },
		];

		const totalCount = alarmsCount + timersCount + worldClocksCount + presetsCount;

		return {
			entities,
			totalCount,
			lastActivityAt,
		};
	}

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 */
	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete alarms
		const deletedAlarms = await this.db
			.delete(schema.alarms)
			.where(eq(schema.alarms.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'alarms',
			count: deletedAlarms.length,
			label: 'Wecker',
		});
		totalDeleted += deletedAlarms.length;

		// Delete timers
		const deletedTimers = await this.db
			.delete(schema.timers)
			.where(eq(schema.timers.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'timers',
			count: deletedTimers.length,
			label: 'Timer',
		});
		totalDeleted += deletedTimers.length;

		// Delete world clocks
		const deletedWorldClocks = await this.db
			.delete(schema.worldClocks)
			.where(eq(schema.worldClocks.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'world_clocks',
			count: deletedWorldClocks.length,
			label: 'Weltuhren',
		});
		totalDeleted += deletedWorldClocks.length;

		// Delete presets
		const deletedPresets = await this.db
			.delete(schema.presets)
			.where(eq(schema.presets.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'presets',
			count: deletedPresets.length,
			label: 'Vorlagen',
		});
		totalDeleted += deletedPresets.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return {
			success: true,
			deletedCounts,
			totalDeleted,
		};
	}
}
