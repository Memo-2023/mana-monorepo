/**
 * ManaLink — Reactive Live Queries
 *
 * Svelte 5 reactive queries for cross-app links.
 * Auto-update when IndexedDB changes (local writes, sync, other tabs).
 */

import { useLiveQueryWithDefault } from '@manacore/local-store/svelte';
import { linkCollection } from './store.js';
import type { LocalManaLink, ManaRecordRef } from './types.js';

/**
 * Get all links where this record is the source.
 * Because we store reverse records, this returns links in BOTH directions.
 */
export function useLinksForRecord(ref: ManaRecordRef) {
	return useLiveQueryWithDefault(
		() =>
			linkCollection.getAll({
				sourceApp: ref.app,
				sourceId: ref.id,
			} as Partial<LocalManaLink>),
		[] as LocalManaLink[]
	);
}

/**
 * Get all links for an entire app.
 */
export function useLinksForApp(appId: string) {
	return useLiveQueryWithDefault(
		() =>
			linkCollection.getAll({
				sourceApp: appId,
			} as Partial<LocalManaLink>),
		[] as LocalManaLink[]
	);
}

/**
 * Get links of a specific type for a record.
 */
export function useLinksOfType(ref: ManaRecordRef, linkType: string) {
	return useLiveQueryWithDefault(async () => {
		const all = await linkCollection.getAll({
			sourceApp: ref.app,
			sourceId: ref.id,
		} as Partial<LocalManaLink>);
		return all.filter((l) => l.linkType === linkType);
	}, [] as LocalManaLink[]);
}

/**
 * Count links for a record.
 */
export function useLinkCount(ref: ManaRecordRef) {
	return useLiveQueryWithDefault(async () => {
		const all = await linkCollection.getAll({
			sourceApp: ref.app,
			sourceId: ref.id,
		} as Partial<LocalManaLink>);
		return all.length;
	}, 0);
}
