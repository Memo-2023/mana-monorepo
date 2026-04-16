/**
 * Goals module seed handler — applied by the workbench-template
 * applicator when a template includes `seeds.goals`.
 *
 * Idempotency: matched by exact-title. A non-deleted goal with the
 * same title is treated as "already seeded". Users can rename the
 * goal freely without breaking idempotency because we only check on
 * apply, not on update.
 */

import { db } from '$lib/data/database';
import { registerSeedHandler, type SeedOutcome } from '$lib/data/ai/agents/seed-registry';
import { goalStore } from './store';
import type { LocalGoal, GoalMetric, GoalTarget } from './types';

interface GoalSeed {
	title: string;
	description?: string;
	moduleId: string;
	metric: GoalMetric;
	target: GoalTarget;
}

registerSeedHandler({
	moduleName: 'goals',
	async apply(items) {
		const outcomes: SeedOutcome[] = [];
		const existing = await db.table<LocalGoal>('companionGoals').toArray();
		const existingTitles = new Set(
			existing.filter((g) => g.status !== 'abandoned').map((g) => g.title)
		);

		for (const item of items) {
			const seed = item.data as GoalSeed;

			if (existingTitles.has(seed.title)) {
				outcomes.push({ stableId: item.stableId, outcome: 'skipped-exists' });
				continue;
			}

			try {
				await goalStore.create({
					title: seed.title,
					description: seed.description,
					moduleId: seed.moduleId,
					metric: seed.metric,
					target: seed.target,
				});
				existingTitles.add(seed.title);
				outcomes.push({ stableId: item.stableId, outcome: 'created' });
			} catch (err) {
				outcomes.push({
					stableId: item.stableId,
					outcome: 'failed',
					error: err instanceof Error ? err.message : String(err),
				});
			}
		}

		return outcomes;
	},
});
