/**
 * Dedup pass for the `workbenchScenes` table — collapses the duplicate
 * "Home" scenes the seeding race in `workbench-scenes.svelte.ts` has been
 * accumulating since the Spaces-Foundation migration shipped 2026-04-22.
 *
 * Background: the seeder writes rows without `spaceId`, so the Dexie
 * creating-hook stamps `_personal:<userId>` (sentinel). The dedup check
 * in `onActiveSpaceChanged` filters by the *real* space UUID and never
 * finds them — every login adds duplicates. Full root-cause + the
 * upcoming structural fix (per-space-seeds registry + deterministic
 * ids + creating-hook hardening) live in
 * `docs/plans/workbench-seeding-cleanup.md`.
 *
 * This file is the soft cleanup: idempotent, content-aware, takes
 * `name === 'Home'` rows that look like default seeds (no description /
 * wallpaper / viewingAsAgentId / scopeTagIds — i.e. nothing the user
 * has customised), groups them by `spaceId`, picks one survivor per
 * group, merges every loser's `openApps` into it, and soft-deletes the
 * rest so mana-sync propagates the cleanup to other devices.
 *
 * Pure: takes a Dexie Table reference, never reaches into the live
 * `db`. That keeps it import-cycle-free so it can run inside a
 * `db.version(N).upgrade()` callback (where it gets `tx.table(...)`)
 * AND from app-runtime callers (where they pass `db.table(...)`).
 */

import type { Table } from 'dexie';
import type { LocalWorkbenchScene, WorkbenchSceneApp } from '$lib/types/workbench-scenes';

const HOME_NAME = 'Home';

/**
 * A scene is a candidate for merging when it looks like a fresh default
 * "Home" seed — anything the user might have set themselves disqualifies
 * the row so we never destroy custom layouts.
 */
function isDefaultHomeSeed(row: LocalWorkbenchScene): boolean {
	if (row.deletedAt) return false;
	if (row.name !== HOME_NAME) return false;
	if (row.description) return false;
	if (row.wallpaper) return false;
	if (row.viewingAsAgentId) return false;
	if (row.scopeTagIds && row.scopeTagIds.length > 0) return false;
	return true;
}

/**
 * Run dedup on the given `workbenchScenes` table. Returns the number of
 * rows soft-deleted. Idempotent — safe to invoke repeatedly.
 *
 * The caller is expected to wrap this in a transaction when called
 * outside of a Dexie `upgrade()` callback (upgrade callbacks already
 * give a transaction-bound `tx.table()` reference).
 */
export async function dedupHomeScenesOn(
	table: Table<LocalWorkbenchScene, string>
): Promise<number> {
	const rows = await table.toArray();

	// Bucket by spaceId. Rows without a spaceId can't be safely grouped
	// (their target space is ambiguous) — skip them. Rows that look like
	// user-customised scenes are also out, even if they happen to be
	// named "Home", so a deliberate two-Home setup stays intact.
	const groups = new Map<string, LocalWorkbenchScene[]>();
	for (const row of rows) {
		if (!isDefaultHomeSeed(row)) continue;
		const spaceId = (row as { spaceId?: unknown }).spaceId;
		if (typeof spaceId !== 'string' || !spaceId) continue;
		let group = groups.get(spaceId);
		if (!group) {
			group = [];
			groups.set(spaceId, group);
		}
		group.push(row);
	}

	const now = new Date().toISOString();
	let removed = 0;

	for (const group of groups.values()) {
		if (group.length <= 1) continue;

		// Survivor pick: the row with the most openApps wins (it's the
		// most likely to carry the user's accumulated app additions),
		// breaking ties by most-recent updatedAt.
		group.sort((a, b) => {
			const aLen = a.openApps?.length ?? 0;
			const bLen = b.openApps?.length ?? 0;
			if (aLen !== bLen) return bLen - aLen;
			const aTime = a.updatedAt ?? '';
			const bTime = b.updatedAt ?? '';
			return bTime.localeCompare(aTime);
		});
		const [survivor, ...losers] = group;

		// Merge every loser's openApps into the survivor, dedupe by
		// appId so the user doesn't end up with two `todo` panels.
		const merged: WorkbenchSceneApp[] = [...(survivor.openApps ?? [])];
		const seen = new Set(merged.map((a) => a.appId));
		for (const loser of losers) {
			for (const app of loser.openApps ?? []) {
				if (!seen.has(app.appId)) {
					seen.add(app.appId);
					merged.push(app);
				}
			}
		}
		const survivorAppCount = survivor.openApps?.length ?? 0;
		if (merged.length !== survivorAppCount) {
			await table.update(survivor.id, { openApps: merged, updatedAt: now });
		}

		// Soft-delete the losers via deletedAt so the unified sync engine
		// propagates the dedup to other devices instead of resurrecting
		// the rows on next pull.
		for (const loser of losers) {
			await table.update(loser.id, { deletedAt: now, updatedAt: now });
			removed++;
		}
	}

	return removed;
}
