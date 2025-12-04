import { Injectable, Inject } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { contactActivities } from '../db/schema';
import type { ContactActivity, NewContactActivity } from '../db/schema';

export type ActivityType = 'created' | 'updated' | 'called' | 'emailed' | 'met' | 'note_added';

@Injectable()
export class ActivityService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByContactId(contactId: string, userId: string, limit = 50): Promise<ContactActivity[]> {
		return this.db
			.select()
			.from(contactActivities)
			.where(and(eq(contactActivities.contactId, contactId), eq(contactActivities.userId, userId)))
			.orderBy(desc(contactActivities.createdAt))
			.limit(limit);
	}

	async create(data: NewContactActivity): Promise<ContactActivity> {
		const [activity] = await this.db.insert(contactActivities).values(data).returning();
		return activity;
	}

	async logActivity(
		contactId: string,
		userId: string,
		activityType: ActivityType,
		description?: string,
		metadata?: Record<string, unknown>
	): Promise<ContactActivity> {
		return this.create({
			contactId,
			userId,
			activityType,
			description,
			metadata,
		});
	}
}
