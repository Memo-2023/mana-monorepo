import { Injectable, Inject } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/db';
import { userGoals, type NewUserGoals } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class GoalsService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getGoals(userId: string) {
		const [goals] = await this.db
			.select()
			.from(userGoals)
			.where(eq(userGoals.userId, userId))
			.limit(1);

		return goals || null;
	}

	async createOrUpdate(userId: string, data: Omit<NewUserGoals, 'id' | 'userId'>) {
		const existing = await this.getGoals(userId);

		if (existing) {
			const [updated] = await this.db
				.update(userGoals)
				.set({ ...data, updatedAt: new Date() })
				.where(eq(userGoals.userId, userId))
				.returning();
			return updated;
		}

		const [created] = await this.db
			.insert(userGoals)
			.values({ ...data, userId })
			.returning();
		return created;
	}

	async delete(userId: string) {
		const [deleted] = await this.db
			.delete(userGoals)
			.where(eq(userGoals.userId, userId))
			.returning();
		return deleted;
	}
}
