import { Injectable, Inject } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DATABASE_TOKEN } from '../db/database.module';
import { Database } from '../db/connection';
import { activities, Activity } from '../db/schema';

@Injectable()
export class ActivityService {
	constructor(@Inject(DATABASE_TOKEN) private db: Database) {}

	async findAll(userId: string, limit = 50): Promise<Activity[]> {
		return this.db
			.select()
			.from(activities)
			.where(eq(activities.userId, userId))
			.orderBy(desc(activities.timestamp))
			.limit(limit);
	}

	async findBySkill(userId: string, skillId: string): Promise<Activity[]> {
		return this.db
			.select()
			.from(activities)
			.where(eq(activities.skillId, skillId))
			.orderBy(desc(activities.timestamp));
	}

	async getRecent(userId: string, limit = 10): Promise<Activity[]> {
		return this.db
			.select()
			.from(activities)
			.where(eq(activities.userId, userId))
			.orderBy(desc(activities.timestamp))
			.limit(limit);
	}
}
