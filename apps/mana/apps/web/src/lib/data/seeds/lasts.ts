/**
 * Per-Space "Welcome" seed for the Lasts module.
 *
 * Drops a single confirmed welcome row into each Space the first time
 * that Space is activated, so the empty state is replaced by a concrete
 * example users can edit or delete. Idempotent via deterministic id —
 * see docs/plans/workbench-seeding-cleanup.md for the per-space-seeds
 * registry contract.
 */

import { db } from '../database';
import { encryptRecord } from '../crypto';
import { registerSpaceSeed } from '../scope/per-space-seeds';
import type { LocalLast } from '$lib/modules/lasts/types';

const TABLE = 'lasts';

export function lastsWelcomeSeedId(spaceId: string): string {
	return `seed-welcome-${spaceId}`;
}

registerSpaceSeed('lasts-welcome', async (spaceId) => {
	const id = lastsWelcomeSeedId(spaceId);
	const existing = await db.table(TABLE).get(id);
	if (existing) return;

	const now = new Date().toISOString();
	const row: LocalLast = {
		id,
		spaceId,
		title: 'Willkommen bei Lasts',
		status: 'confirmed',
		category: 'other',
		confidence: 'certain',
		inferredFrom: null,
		date: now.slice(0, 10),
		meaning:
			'Hier hältst du fest, was zum letzten Mal passiert ist — bewusst markiert oder rückwirkend erkannt.',
		note: null,
		whatIKnewThen: null,
		whatIKnowNow: null,
		tenderness: 3,
		wouldReclaim: null,
		reclaimedAt: null,
		reclaimedNote: null,
		personIds: [],
		sharedWith: null,
		mediaIds: [],
		audioNoteId: null,
		placeId: null,
		recognisedAt: now,
		isPinned: false,
		isArchived: false,
		visibility: 'private',
	} as LocalLast;

	await encryptRecord(TABLE, row);
	await db.table(TABLE).add(row);
});
