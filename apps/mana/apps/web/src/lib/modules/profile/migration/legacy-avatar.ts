/**
 * One-shot migration of the legacy `auth.users.image` URL into a
 * meImages row with `primaryFor='avatar'`. Runs the first time the
 * user opens /profile/me-images after M2.5 ships; idempotent after
 * that (localStorage guard + primary-slot existence check).
 *
 * Why this lives as a client-side bootstrap rather than a Dexie
 * db.version() upgrade: the legacy value lives in Better Auth
 * (services/mana-auth), not in Dexie. A schema-upgrade hook has no
 * way to reach it without a network call, and running network calls
 * from inside a Dexie version upgrade is exactly the kind of thing
 * that breaks silently on slow links. A mount-time bootstrap gives
 * us explicit error handling + a retry path (next visit).
 *
 * The migrated row carries a sentinel mediaId (`legacy-avatar:<uid>`)
 * because the original bytes were not uploaded through mana-media —
 * they live wherever the old avatar upload endpoint put them. As a
 * result, this row intentionally fails M3's verifyMediaOwnership if
 * the user ever flips its `usage.aiReference` on and tries to use it
 * for generation. That is correct: legacy avatars shouldn't silently
 * start feeding OpenAI without an explicit re-upload.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { profileService } from '$lib/api/profile';
import { meImagesTable } from '../collections';
import { meImagesStore } from '../stores/me-images.svelte';

export async function migrateLegacyAvatarIfNeeded(): Promise<void> {
	const user = authStore.user;
	if (!user?.id) return;

	const flagKey = `mana.profile.avatarMigration.${user.id}`;
	if (typeof localStorage !== 'undefined' && localStorage.getItem(flagKey)) return;

	// Already have an avatar-holder? Mark done and skip. This also
	// covers the case where a user had their primary set in a prior
	// browser — after sync catches up, the row is here and we should
	// not create a duplicate.
	const existing = await meImagesTable.where('primaryFor').equals('avatar').toArray();
	if (existing.some((row) => !row.deletedAt)) {
		try {
			localStorage.setItem(flagKey, '1');
		} catch {
			// localStorage blocked — fine, next visit re-checks Dexie.
		}
		return;
	}

	let profile;
	try {
		profile = await profileService.getProfile();
	} catch {
		// Offline or Better Auth down; try again on next visit.
		return;
	}
	if (!profile.image) {
		try {
			localStorage.setItem(flagKey, '1');
		} catch {
			// ignore
		}
		return;
	}

	await meImagesStore.createMeImage({
		kind: 'face',
		// Sentinel mediaId: not a real mana-media reference. The generate-
		// with-reference path (M3) gates on MediaClient.list({app:'me'}),
		// so this id will naturally bounce if ever used for generation.
		mediaId: `legacy-avatar:${user.id}`,
		storagePath: profile.image,
		publicUrl: profile.image,
		thumbnailUrl: profile.image,
		width: 0,
		height: 0,
		label: 'Bisheriges Profilbild',
		usage: { aiReference: false, showInProfile: true },
		primaryFor: 'avatar',
		// Legacy avatar is the user's global SSO identity (Better Auth
		// `users.image`) — it belongs explicitly in the *personal* space,
		// regardless of which space the user happens to be in when the
		// migration fires. Use the `_personal:<uid>` sentinel that
		// reconcileSentinels() rewrites to the real personal-space id on
		// the next active-space bootstrap (same pattern v28 used for the
		// blanket data-table migration).
		spaceId: `_personal:${user.id}`,
	});

	try {
		localStorage.setItem(flagKey, '1');
	} catch {
		// ignore
	}
}
