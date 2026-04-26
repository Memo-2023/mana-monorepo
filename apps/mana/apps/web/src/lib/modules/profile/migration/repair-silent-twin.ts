/**
 * One-shot repair for the M2.5 silent-twin bug (fixed in the commit
 * that adds this file).
 *
 * Before the fix, `setPrimary(id, 'face-ref')` ran two sequential
 * `setPrimaryInTx` calls on the same row — one for face-ref, then a
 * silent twin for avatar. Because `primaryFor` is a single column the
 * second write clobbered the first, so every new face upload ended
 * up with `primaryFor='avatar'` and `useImageByPrimary('face-ref')`
 * returned null. Wardrobe's TryOn banner stayed forever, Try-On was
 * blocked, Picture's reference picker showed nothing.
 *
 * This bootstrap walks the meImages table once per user (localStorage
 * guard) and rewrites rows that are clearly silent-twin victims back
 * to `primaryFor='face-ref'`. Legacy-avatar rows (written by the
 * pre-M2.5 migration) are distinguishable by their sentinel mediaId
 * `legacy-avatar:<uid>` and are left alone — `syncAvatarToAuth` still
 * uses them as a fallback when no face-ref exists.
 *
 * Runs at MeImagesView mount alongside `migrateLegacyAvatarIfNeeded`.
 * Idempotent after the first pass via the localStorage flag; the
 * per-row check is also idempotent so re-running is safe.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { meImagesTable } from '../collections';
import { makeSystemActor, runAsAsync, SYSTEM_MIGRATION } from '$lib/data/events/actor';

export async function repairSilentTwinAvatarRows(): Promise<void> {
	const user = authStore.user;
	if (!user?.id) return;

	const flagKey = `mana.profile.silentTwinRepair.${user.id}`;
	if (typeof localStorage !== 'undefined' && localStorage.getItem(flagKey)) return;

	// Find every row currently holding `primaryFor='avatar'`. That set
	// contains two kinds of rows:
	//   - legacy-avatar rows (mediaId starts with `legacy-avatar:`) —
	//     legitimate, produced by migrateLegacyAvatarIfNeeded.
	//   - silent-twin victims (any other mediaId) — user uploads that
	//     were supposed to be face-ref but got overwritten to avatar.
	// Only the second group is repaired.
	const avatarHolders = await meImagesTable.where('primaryFor').equals('avatar').toArray();
	const victims = avatarHolders.filter(
		(row) => !row.deletedAt && !row.mediaId.startsWith('legacy-avatar:')
	);

	if (victims.length === 0) {
		try {
			localStorage.setItem(flagKey, '1');
		} catch {
			// localStorage blocked — fine, next mount re-checks Dexie.
		}
		return;
	}

	// Transactional rewrite: if multiple victims exist (rare but
	// possible after repeated uploads), keep the newest as face-ref and
	// clear the primaryFor of the rest. Matches the "one holder per
	// slot" invariant the query layer expects.
	victims.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
	const nowIso = new Date().toISOString();

	// Run the rewrite under a migration-system actor so the Dexie
	// updating-hook stamps `origin: 'migration'` on every touched field.
	// Conflict-detection later treats these writes as pipeline-internal —
	// a fresh client pulling the same updates from another device must
	// NOT see "another session overwrote your edit" toasts.
	const migrationActor = makeSystemActor(SYSTEM_MIGRATION, 'Repair: silent-twin');
	await runAsAsync(migrationActor, async () => {
		await meImagesTable.db.transaction('rw', meImagesTable, async () => {
			for (let i = 0; i < victims.length; i++) {
				const row = victims[i];
				await meImagesTable.update(row.id, {
					primaryFor: i === 0 ? 'face-ref' : null,
				});
			}
		});
	});

	try {
		localStorage.setItem(flagKey, '1');
	} catch {
		// ignore
	}
}
