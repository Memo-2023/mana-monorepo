/**
 * Meditate module seed handler — applied by the workbench-template
 * applicator when a template includes `seeds.meditate`.
 *
 * Idempotency strategy (T1 pragmatism): the stableId is embedded into
 * the preset's description as a fenced-code marker — looking for
 * `\`template-*\`` in an existing record counts as "already seeded".
 * T2 introduces a proper `templateStableId` column on the preset
 * schema, which will make this cleaner.
 */

import { db } from '$lib/data/database';
import { registerSeedHandler, type SeedOutcome } from '$lib/data/ai/agents/seed-registry';
import { meditateStore } from './stores/meditate.svelte';
import type { LocalMeditatePreset, MeditateCategory, BreathPattern } from './types';

interface MeditatePresetSeed {
	name: string;
	description?: string;
	category: MeditateCategory;
	breathPattern?: BreathPattern | null;
	bodyScanSteps?: string[] | null;
	defaultDurationSec?: number;
}

/** Build the description string with an appended stable-id marker so
 *  later apply calls can recognize the seeded preset. Users see only
 *  the human-readable prose; the marker is invisible in most views. */
function buildDescription(seed: MeditatePresetSeed, stableId: string | undefined): string {
	const marker = stableId ? `\n\n<!-- seed:${stableId} -->` : '';
	return (seed.description ?? '') + marker;
}

function hasSeedMarker(desc: string | undefined, stableId: string): boolean {
	return typeof desc === 'string' && desc.includes(`seed:${stableId}`);
}

registerSeedHandler({
	moduleName: 'meditate',
	async apply(items) {
		const outcomes: SeedOutcome[] = [];
		const existing = await db.table<LocalMeditatePreset>('meditatePresets').toArray();

		for (const item of items) {
			const seed = item.data as MeditatePresetSeed;

			if (item.stableId) {
				const already = existing.find(
					(p) => !p.deletedAt && hasSeedMarker(p.description, item.stableId!)
				);
				if (already) {
					outcomes.push({ stableId: item.stableId, outcome: 'skipped-exists' });
					continue;
				}
			}

			try {
				await meditateStore.createPreset({
					name: seed.name,
					description: buildDescription(seed, item.stableId),
					category: seed.category,
					breathPattern: seed.breathPattern ?? null,
					bodyScanSteps: seed.bodyScanSteps ?? null,
					defaultDurationSec: seed.defaultDurationSec,
				});
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
