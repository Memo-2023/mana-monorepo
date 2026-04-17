/**
 * Persistence for long-running research tasks (openai-deep-research).
 * Minimal CRUD + a helper to mark jobs done/failed with credit commit/refund.
 */

import { and, desc, eq } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { asyncJobs } from '../db/schema/research';
import type { AsyncJob, NewAsyncJob } from '../db/schema/research';

export class AsyncJobStorage {
	constructor(private db: Database) {}

	async create(input: NewAsyncJob): Promise<AsyncJob> {
		const [row] = await this.db.insert(asyncJobs).values(input).returning();
		return row;
	}

	async get(id: string, userId: string): Promise<AsyncJob | null> {
		const [row] = await this.db
			.select()
			.from(asyncJobs)
			.where(and(eq(asyncJobs.id, id), eq(asyncJobs.userId, userId)))
			.limit(1);
		return row ?? null;
	}

	async list(userId: string, limit = 25): Promise<AsyncJob[]> {
		return this.db
			.select()
			.from(asyncJobs)
			.where(eq(asyncJobs.userId, userId))
			.orderBy(desc(asyncJobs.createdAt))
			.limit(limit);
	}

	async updateStatus(
		id: string,
		patch: Partial<Pick<AsyncJob, 'status' | 'result' | 'errorMessage' | 'externalId'>>
	): Promise<void> {
		await this.db
			.update(asyncJobs)
			.set({ ...patch, updatedAt: new Date() })
			.where(eq(asyncJobs.id, id));
	}
}
