/**
 * Profile module — read-side queries.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { decryptRecords } from '$lib/data/crypto';
import { meImagesTable, userContextTable } from './collections';
import {
	USER_CONTEXT_SINGLETON_ID,
	toUserContext,
	toMeImage,
	type UserContext,
	type MeImage,
	type MeImageKind,
	type MeImagePrimarySlot,
} from './types';

/** Reactive live-query for the user context singleton. */
export function useUserContext() {
	return useLiveQueryWithDefault<UserContext | null>(async () => {
		const local = await userContextTable.get(USER_CONTEXT_SINGLETON_ID);
		if (!local || local.deletedAt) return null;
		const [decrypted] = await decryptRecords('userContext', [local]);
		return toUserContext(decrypted);
	}, null);
}

/**
 * All non-deleted me-images, newest first. Decrypted on the client —
 * filters and sorting happen before decrypt where possible (`kind`,
 * `primaryFor`, `createdAt` are plaintext indices).
 */
export function useAllMeImages() {
	return useLiveQueryWithDefault<MeImage[]>(async () => {
		const locals = await meImagesTable.orderBy('createdAt').reverse().toArray();
		const visible = locals.filter((row) => !row.deletedAt);
		const decrypted = await decryptRecords('meImages', visible);
		return decrypted.map(toMeImage);
	}, [] as MeImage[]);
}

/**
 * Me-images filtered by `kind`. Uses the `kind` Dexie index so large
 * pools still filter in one B-tree lookup.
 */
export function useMeImagesByKind(kind: MeImageKind) {
	return useLiveQueryWithDefault<MeImage[]>(async () => {
		const locals = await meImagesTable.where('kind').equals(kind).toArray();
		const visible = locals
			.filter((row) => !row.deletedAt)
			.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
		const decrypted = await decryptRecords('meImages', visible);
		return decrypted.map(toMeImage);
	}, [] as MeImage[]);
}

/**
 * Only images the user explicitly opted in for AI reference use.
 * This is the authoritative list the Picture generator's Reference
 * picker reads from — if an image isn't here, it must not be sent
 * to OpenAI.
 */
export function useReferenceImages() {
	return useLiveQueryWithDefault<MeImage[]>(async () => {
		const locals = await meImagesTable.orderBy('createdAt').reverse().toArray();
		const visible = locals.filter((row) => !row.deletedAt && row.usage?.aiReference === true);
		const decrypted = await decryptRecords('meImages', visible);
		return decrypted.map(toMeImage);
	}, [] as MeImage[]);
}

/**
 * Current holder of a primary slot (avatar / face-ref / body-ref),
 * or null if nobody claimed it yet. Powers the avatar fallback and
 * the Reference picker's default selection.
 */
export function useImageByPrimary(slot: MeImagePrimarySlot) {
	return useLiveQueryWithDefault<MeImage | null>(async () => {
		const locals = await meImagesTable.where('primaryFor').equals(slot).toArray();
		const visible = locals.filter((row) => !row.deletedAt);
		if (visible.length === 0) return null;
		// The setPrimary store method keeps this to exactly one row. If
		// somehow more than one slipped through (manual DB edit, race on
		// a broken migration), prefer the most recent write.
		visible.sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
		const [decrypted] = await decryptRecords('meImages', [visible[0]]);
		return toMeImage(decrypted);
	}, null);
}
