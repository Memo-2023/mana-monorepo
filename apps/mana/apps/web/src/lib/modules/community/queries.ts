/**
 * Community module — SWR-style queries.
 *
 * Feedback lives server-only (no Dexie / mana-sync), so we expose
 * Svelte 5 reactive stores that pull from the feedback service and
 * cache results across mounts within a session.
 */

import type { PublicFeedbackItem, FeedbackQueryParams } from '@mana/feedback';
import { feedbackService, publicFeedbackService } from '$lib/api/feedback';
import { authStore } from '$lib/stores/auth.svelte';

/**
 * Stateful query for the public community feed.
 *
 * Reads via the auth-enriched endpoint when a user is logged in (so each
 * item carries `myReactions` for highlight-state); falls back to the
 * anonymous endpoint when guest. Polls on demand via `reload()`.
 */
export function useCommunityFeed(initial: FeedbackQueryParams = {}) {
	let items = $state<PublicFeedbackItem[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let lastQuery = $state<FeedbackQueryParams>(initial);

	async function reload(query?: FeedbackQueryParams) {
		const q = query ?? lastQuery;
		lastQuery = q;
		loading = true;
		error = null;
		try {
			if (authStore.user) {
				items = await feedbackService.getPublicFeed(q);
			} else {
				items = await publicFeedbackService.getFeed(q);
			}
		} catch (err) {
			console.error('[community/queries] reload failed:', err);
			error = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	// kick off initial load
	void reload(initial);

	return {
		get items() {
			return items;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		reload,
	};
}

/**
 * Single-item query plus its replies.
 */
export function useCommunityItem(id: string) {
	let item = $state<PublicFeedbackItem | null>(null);
	let replies = $state<PublicFeedbackItem[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function reload() {
		loading = true;
		error = null;
		try {
			const data = await publicFeedbackService.getItem(id);
			item = data.item;
			replies = data.replies;
		} catch (err) {
			console.error('[community/queries] item fetch failed:', err);
			error = err instanceof Error ? err.message : 'Laden fehlgeschlagen';
		} finally {
			loading = false;
		}
	}

	void reload();

	return {
		get item() {
			return item;
		},
		get replies() {
			return replies;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		reload,
	};
}

/** Toggle a reaction; on success patches `items` in place. */
export async function toggleReactionOnItem(
	itemsRef: { items: PublicFeedbackItem[] },
	id: string,
	emoji: string
) {
	if (!authStore.user) return;
	try {
		const res = await feedbackService.toggleReaction(id, emoji as never);
		// Patch in place — caller manages reactivity by re-assigning the array
		// or relying on $state-deep reactivity in calling component.
		const idx = itemsRef.items.findIndex((i) => i.id === id);
		if (idx >= 0) {
			const old = itemsRef.items[idx];
			const myReactions = res.userHasReacted
				? Array.from(new Set([...(old.myReactions ?? []), emoji]))
				: (old.myReactions ?? []).filter((e) => e !== emoji);
			itemsRef.items[idx] = {
				...old,
				reactions: res.reactions,
				score: res.score,
				myReactions,
			};
		}
	} catch (err) {
		console.error('[community/queries] toggleReaction failed:', err);
	}
}
