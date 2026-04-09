/**
 * Reactions store — records the user's per-article feedback and pipes
 * the matching weight delta into the preferences store in the same
 * call. Two writes, one logical operation:
 *
 *   1. add a `newsReactions` row (drops the article from `reactedIds`
 *      so the feed engine stops surfacing it)
 *   2. apply the weight diff back to `newsPreferences`
 *
 * The reaction row stays around so undo / "show what I dismissed"
 * stays cheap. The preferences diff is what makes the suppression
 * persist across cache refreshes.
 */

import { encryptRecord } from '$lib/data/crypto';
import { reactionTable } from '../collections';
import { applyReaction as computeWeightDiff } from '../feed-engine';
import { preferencesStore } from './preferences.svelte';
import type { LocalReaction, ReactionKind } from '../types';

async function loadCurrentPrefs() {
	return preferencesStore.get();
}

export const reactionsStore = {
	async react(input: {
		articleId: string;
		reaction: ReactionKind;
		topic: string;
		sourceSlug: string;
	}): Promise<void> {
		const prefs = await loadCurrentPrefs();

		// 1. Persist the reaction row.
		const row: LocalReaction = {
			id: crypto.randomUUID(),
			articleId: input.articleId,
			reaction: input.reaction,
			topic: input.topic,
			sourceSlug: input.sourceSlug,
		};
		await encryptRecord('newsReactions', row);
		await reactionTable.add(row);

		// 2. Update preferences (weight + blocklist) in lockstep.
		const diff = computeWeightDiff(prefs, input.reaction, input.topic, input.sourceSlug);
		if (Object.keys(diff).length > 0) {
			await preferencesStore.applyWeightDiff(diff);
		}
	},

	async undo(reactionId: string): Promise<void> {
		// Soft-delete: tombstone the reaction so the article shows up
		// again in the feed. Weights stay where they were — undoing a
		// thumbs-down doesn't *boost* the source, it just stops further
		// suppression.
		await reactionTable.update(reactionId, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},
};
