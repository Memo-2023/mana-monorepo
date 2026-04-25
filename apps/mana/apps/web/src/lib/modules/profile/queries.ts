/**
 * Profile module — read-side queries.
 *
 * `userContext` stays a per-user singleton (read via the direct
 * collection). `meImages` is now space-scoped (v40) — all reads go
 * through `scopedForModule` so switching the active space flips the
 * visible pool without any query re-write.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { decryptRecords } from '$lib/data/crypto';
import { scopedForModule } from '$lib/data/scope';
import { userContextTable } from './collections';
import {
	USER_CONTEXT_SINGLETON_ID,
	toUserContext,
	toMeImage,
	type LocalMeImage,
	type UserContext,
	type MeImage,
	type MeImageKind,
	type MeImagePrimarySlot,
} from './types';

/** Reactive live-query for the user context singleton. */
export function useUserContext() {
	return useScopedLiveQuery<UserContext | null>(async () => {
		const local = await userContextTable.get(USER_CONTEXT_SINGLETON_ID);
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('userContext', [local]);
		return toUserContext(decrypted);
	}, null);
}

/**
 * All non-deleted me-images in the active space, newest first. The
 * `scopedForModule` wrapper filters in-memory by `spaceId`; the live-
 * query re-runs automatically when the active space changes.
 */
export function useAllMeImages() {
	return useScopedLiveQuery<MeImage[]>(async () => {
		const locals = await scopedForModule<LocalMeImage, string>('profile', 'meImages').toArray();
		const visible = locals
			.filter((row) => !row.deletedAt)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('meImages', visible);
		return decrypted.map(toMeImage);
	}, [] as MeImage[]);
}

/**
 * Me-images in the active space filtered by `kind`.
 */
export function useMeImagesByKind(kind: MeImageKind) {
	return useScopedLiveQuery<MeImage[]>(async () => {
		const locals = await scopedForModule<LocalMeImage, string>('profile', 'meImages')
			.and((row) => row.kind === kind)
			.toArray();
		const visible = locals
			.filter((row) => !row.deletedAt)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('meImages', visible);
		return decrypted.map(toMeImage);
	}, [] as MeImage[]);
}

/**
 * Only images the user explicitly opted in for AI reference use
 * **within the active space**. This is the authoritative list the
 * Picture generator's Reference picker reads from — if an image
 * isn't here, it must not be sent to OpenAI.
 */
export function useReferenceImages() {
	return useScopedLiveQuery<MeImage[]>(async () => {
		const locals = await scopedForModule<LocalMeImage, string>('profile', 'meImages').toArray();
		const visible = locals
			.filter((row) => !row.deletedAt && row.usage?.aiReference === true)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('meImages', visible);
		return decrypted.map(toMeImage);
	}, [] as MeImage[]);
}

/**
 * Current holder of a primary slot (avatar / face-ref / body-ref)
 * **within the active space**. After v40 each space has its own
 * primary slots. Personal-space's `avatar` slot drives
 * `auth.users.image` globally — other spaces' `avatar` slots stay
 * local to that space.
 */
export function useImageByPrimary(slot: MeImagePrimarySlot) {
	return useScopedLiveQuery<MeImage | null>(async () => {
		const locals = await scopedForModule<LocalMeImage, string>('profile', 'meImages')
			.and((row) => row.primaryFor === slot)
			.toArray();
		const visible = locals.filter((row) => !row.deletedAt);
		if (visible.length === 0) return null;
		// The setPrimary store method keeps this to exactly one row per
		// space. If more than one slipped through (manual DB edit, race
		// on a broken migration), prefer the most recent write.
		visible.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
		const [decrypted] = await decryptRecords('meImages', [visible[0]]);
		return toMeImage(decrypted);
	}, null);
}
