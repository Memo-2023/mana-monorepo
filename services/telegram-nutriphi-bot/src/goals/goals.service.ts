import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { UserGoals, NewUserGoals } from '../database/schema';

@Injectable()
export class GoalsService {
	private readonly logger = new Logger(GoalsService.name);

	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: PostgresJsDatabase<typeof schema>
	) {}

	async getGoals(telegramUserId: number): Promise<UserGoals | null> {
		const goals = await this.db.query.userGoals.findFirst({
			where: eq(schema.userGoals.telegramUserId, telegramUserId),
		});
		return goals || null;
	}

	async ensureGoals(telegramUserId: number): Promise<UserGoals> {
		let goals = await this.getGoals(telegramUserId);
		if (!goals) {
			const [newGoals] = await this.db
				.insert(schema.userGoals)
				.values({ telegramUserId })
				.returning();
			goals = newGoals;
			this.logger.log(`Created default goals for user ${telegramUserId}`);
		}
		return goals;
	}

	async setGoals(
		telegramUserId: number,
		data: Partial<Omit<NewUserGoals, 'id' | 'telegramUserId' | 'createdAt' | 'updatedAt'>>
	): Promise<UserGoals> {
		// Ensure user has goals first
		await this.ensureGoals(telegramUserId);

		const [updated] = await this.db
			.update(schema.userGoals)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(schema.userGoals.telegramUserId, telegramUserId))
			.returning();

		this.logger.log(`Updated goals for user ${telegramUserId}`);
		return updated;
	}
}
