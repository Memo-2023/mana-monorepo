/**
 * One-shot cleanup of orphan localStorage keys left behind by deleted
 * migration helpers.
 *
 * When a one-shot bootstrap (e.g. `repairSilentTwinAvatarRows`) finishes
 * the first time, it sets a per-user `mana.profile.<name>.<uid>` flag in
 * localStorage so it doesn't run again. After the helper itself is
 * deleted (F7 of docs/plans/sync-field-meta-overhaul.md), the flag stays
 * behind forever — a small chunk of dead state that piles up if more
 * helpers come and go.
 *
 * This module sweeps the known orphan prefixes and removes any matching
 * key on every page load. Cheap (a single localStorage scan, capped by
 * the browser's quota) and idempotent — calling it twice is a no-op
 * the second time because the keys are already gone.
 *
 * Add a new prefix here whenever a migration helper is deleted in a
 * future commit, then remove the prefix again once enough time has
 * passed that no live device still carries the orphan flag.
 */

/**
 * Known dead localStorage prefixes. Keep in chronological order with a
 * comment naming the deletion commit so it's clear when the entry can
 * be removed once enough time has passed.
 */
const ORPHAN_KEY_PREFIXES: readonly string[] = [
	// F7: `repair-silent-twin.ts` deleted in 2a8e8ff98 (sync field-meta
	// overhaul). The helper guarded itself with this flag so it'd only
	// run once per user; the flag now points at code that no longer
	// exists.
	'mana.profile.silentTwinRepair.',
	// F7: `legacy-avatar.ts` deleted in the same commit, same flag
	// pattern, same orphan situation.
	'mana.profile.avatarMigration.',
];

/**
 * Remove every localStorage key matching one of {@link ORPHAN_KEY_PREFIXES}.
 *
 * Best-effort: failures (private mode, quota errors, locked storage on
 * some browsers) are swallowed silently — orphan flags are cosmetic, not
 * load-bearing.
 */
export function cleanupOrphanMigrationFlags(): void {
	if (typeof localStorage === 'undefined') return;
	const toRemove: string[] = [];
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key) continue;
			if (ORPHAN_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
				toRemove.push(key);
			}
		}
	} catch {
		return;
	}
	for (const key of toRemove) {
		try {
			localStorage.removeItem(key);
		} catch {
			// Storage locked / private mode — next reload retries.
		}
	}
}
