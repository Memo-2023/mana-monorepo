/**
 * ManaLink — Mutation Service
 *
 * Handles creating, deleting, and updating cross-app links.
 * Each link creates TWO records (forward + reverse) sharing a pairId
 * for efficient bidirectional queries.
 */

import { linkLocalStore, linkCollection } from './store.js';
import type { LocalManaLink, CreateManaLinkInput, LinkCachedData } from './types.js';
import { LINK_TYPE_INVERSIONS } from './types.js';

/** Invert a directional link type. Symmetric types return unchanged. */
function invertLinkType(type: string): string {
	return LINK_TYPE_INVERSIONS[type] ?? type;
}

let error = $state<string | null>(null);

export const linkMutations = {
	get error() {
		return error;
	},

	// === Store Lifecycle ===

	async initialize() {
		await linkLocalStore.initialize();
	},

	startSync(getToken: () => Promise<string | null>) {
		linkLocalStore.startSync(getToken);
	},

	stopSync() {
		linkLocalStore.stopSync();
	},

	// === Links ===

	/**
	 * Create a bidirectional link. Inserts TWO records sharing a pairId:
	 * - Forward: source → target
	 * - Reverse: target → source (swapped)
	 */
	async createLink(
		input: CreateManaLinkInput
	): Promise<{ forward: LocalManaLink; reverse: LocalManaLink }> {
		error = null;
		try {
			const pairId = crypto.randomUUID();
			const linkType = input.linkType ?? 'related';

			const forward: LocalManaLink = {
				id: crypto.randomUUID(),
				pairId,
				direction: 'forward',
				sourceApp: input.sourceApp,
				sourceCollection: input.sourceCollection,
				sourceId: input.sourceId,
				targetApp: input.targetApp,
				targetCollection: input.targetCollection,
				targetId: input.targetId,
				linkType,
				cachedSource: input.cachedSource,
				cachedTarget: input.cachedTarget,
			};

			const reverse: LocalManaLink = {
				id: crypto.randomUUID(),
				pairId,
				direction: 'reverse',
				sourceApp: input.targetApp,
				sourceCollection: input.targetCollection,
				sourceId: input.targetId,
				targetApp: input.sourceApp,
				targetCollection: input.sourceCollection,
				targetId: input.sourceId,
				linkType: invertLinkType(linkType),
				cachedSource: input.cachedTarget,
				cachedTarget: input.cachedSource,
			};

			const insertedForward = await linkCollection.insert(forward);
			const insertedReverse = await linkCollection.insert(reverse);

			return { forward: insertedForward, reverse: insertedReverse };
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create link';
			throw e;
		}
	},

	/**
	 * Delete a link pair by pairId. Soft-deletes both forward and reverse records.
	 */
	async deleteLinkPair(pairId: string): Promise<void> {
		error = null;
		try {
			const links = await linkCollection.getAll({
				pairId,
			} as Partial<LocalManaLink>);
			for (const link of links) {
				await linkCollection.delete(link.id);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete link pair';
			throw e;
		}
	},

	/**
	 * Delete a link by its record ID (and its pair partner).
	 */
	async deleteLink(linkId: string): Promise<void> {
		error = null;
		try {
			const link = await linkCollection.get(linkId);
			if (link) {
				await this.deleteLinkPair(link.pairId);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete link';
			throw e;
		}
	},

	/**
	 * Update cached display data on a link record.
	 */
	async updateCache(
		linkId: string,
		cached: Partial<{ cachedSource: LinkCachedData; cachedTarget: LinkCachedData }>
	): Promise<void> {
		error = null;
		try {
			await linkCollection.update(linkId, cached as Partial<LocalManaLink>);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update link cache';
			throw e;
		}
	},
};
