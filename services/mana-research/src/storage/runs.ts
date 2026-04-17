/**
 * Persist eval runs + results to research.* tables.
 */

import { desc, eq, sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { evalResults, evalRuns, providerStats } from '../db/schema/research';
import type { EvalRun, EvalResult, NewEvalRun, NewEvalResult } from '../db/schema/research';

export class RunStorage {
	constructor(private db: Database) {}

	async createRun(input: NewEvalRun): Promise<EvalRun> {
		const [row] = await this.db.insert(evalRuns).values(input).returning();
		return row;
	}

	async addResult(input: NewEvalResult): Promise<EvalResult> {
		const [row] = await this.db.insert(evalResults).values(input).returning();

		// Fire-and-forget stats rollup (no error propagation)
		this.bumpStats(input).catch((err) => console.warn('[storage] stats rollup failed:', err));

		return row;
	}

	async finalizeRunCost(runId: string, totalCostCredits: number): Promise<void> {
		await this.db.update(evalRuns).set({ totalCostCredits }).where(eq(evalRuns.id, runId));
	}

	async listRuns(userId: string, limit = 50, offset = 0) {
		return this.db
			.select()
			.from(evalRuns)
			.where(eq(evalRuns.userId, userId))
			.orderBy(desc(evalRuns.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async getRunWithResults(runId: string, userId: string) {
		const [run] = await this.db.select().from(evalRuns).where(eq(evalRuns.id, runId)).limit(1);
		if (!run || run.userId !== userId) return null;

		const results = await this.db
			.select()
			.from(evalResults)
			.where(eq(evalResults.runId, runId))
			.orderBy(evalResults.providerId);

		return { run, results };
	}

	async rateResult(
		resultId: string,
		userId: string,
		rating: number,
		notes?: string
	): Promise<boolean> {
		// Verify ownership via join
		const [result] = await this.db
			.select({ runUserId: evalRuns.userId, resultId: evalResults.id })
			.from(evalResults)
			.innerJoin(evalRuns, eq(evalResults.runId, evalRuns.id))
			.where(eq(evalResults.id, resultId))
			.limit(1);

		if (!result || result.runUserId !== userId) return false;

		await this.db
			.update(evalResults)
			.set({ userRating: rating, userNotes: notes })
			.where(eq(evalResults.id, resultId));

		return true;
	}

	private async bumpStats(result: NewEvalResult): Promise<void> {
		const day = new Date().toISOString().slice(0, 10);
		const success = result.success ? 1 : 0;
		const error = result.success ? 0 : 1;

		await this.db
			.insert(providerStats)
			.values({
				providerId: result.providerId,
				day,
				totalCalls: 1,
				totalLatencyMs: result.latencyMs,
				totalCostCredits: result.costCredits ?? 0,
				successCount: success,
				errorCount: error,
			})
			.onConflictDoUpdate({
				target: [providerStats.providerId, providerStats.day],
				set: {
					totalCalls: sql`${providerStats.totalCalls} + 1`,
					totalLatencyMs: sql`${providerStats.totalLatencyMs} + ${result.latencyMs}`,
					totalCostCredits: sql`${providerStats.totalCostCredits} + ${result.costCredits ?? 0}`,
					successCount: sql`${providerStats.successCount} + ${success}`,
					errorCount: sql`${providerStats.errorCount} + ${error}`,
				},
			});
	}
}
