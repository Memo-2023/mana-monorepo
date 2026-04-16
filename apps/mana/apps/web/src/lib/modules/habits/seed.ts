/**
 * Habits module seed handler — applied by the workbench-template
 * applicator when a template includes `seeds.habits`.
 *
 * Idempotency: matched by exact-title. A non-deleted habit with the
 * same title is treated as "already seeded" — user may have already
 * applied the template or typed a matching habit themselves. Either
 * way we don't want to create a duplicate.
 */

import { habitTable } from './collections';
import type { LocalHabit } from './types';
import { registerSeedHandler, type SeedOutcome } from '$lib/data/ai/agents/seed-registry';
import { habitsStore } from './stores/habits.svelte';

interface HabitSeed {
	title: string;
	icon: string;
	color: string;
	targetPerDay?: number | null;
	defaultDuration?: number | null;
}

registerSeedHandler({
	moduleName: 'habits',
	async apply(items) {
		const outcomes: SeedOutcome[] = [];
		const existing = (await habitTable.toArray()) as LocalHabit[];
		const existingTitles = new Set(existing.filter((h) => !h.deletedAt).map((h) => h.title));

		for (const item of items) {
			const seed = item.data as HabitSeed;

			if (existingTitles.has(seed.title)) {
				outcomes.push({ stableId: item.stableId, outcome: 'skipped-exists' });
				continue;
			}

			try {
				await habitsStore.createHabit({
					title: seed.title,
					icon: seed.icon,
					color: seed.color,
					targetPerDay: seed.targetPerDay ?? null,
					defaultDuration: seed.defaultDuration ?? null,
				});
				existingTitles.add(seed.title); // guard against intra-batch duplicates
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
