/**
 * Reactive queries & pure helpers for Wishes — uses Dexie liveQuery on the unified DB.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type {
	LocalWish,
	LocalWishList,
	LocalPriceCheck,
	Wish,
	WishList,
	PriceCheck,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toWish(local: LocalWish): Wish {
	return {
		id: local.id,
		title: local.title,
		description: local.description ?? null,
		listId: local.listId ?? null,
		priority: local.priority,
		targetPrice: local.targetPrice ?? null,
		currency: local.currency ?? null,
		productUrls: local.productUrls ?? [],
		imageUrl: local.imageUrl ?? null,
		category: local.category ?? null,
		status: local.status,
		tags: local.tags ?? [],
		notes: local.notes ?? [],
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toWishList(local: LocalWishList): WishList {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? null,
		icon: local.icon ?? null,
		color: local.color ?? null,
		isArchived: local.isArchived,
		order: local.order,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toPriceCheck(local: LocalPriceCheck): PriceCheck {
	return {
		id: local.id,
		wishId: local.wishId,
		url: local.url,
		price: local.price,
		currency: local.currency,
		available: local.available,
		checkedAt: local.checkedAt,
		createdAt: local.createdAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

export function useAllWishes() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalWish, string>('wishes', 'wishesItems').sortBy(
			'order'
		);
		const visible = locals.filter((w) => !w.deletedAt);
		const decrypted = await decryptRecords('wishesItems', visible);
		return decrypted.map(toWish);
	}, [] as Wish[]);
}

export function useAllLists() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalWishList, string>('wishes', 'wishesLists').sortBy(
			'order'
		);
		const visible = locals.filter((l) => !l.deletedAt && !l.isArchived);
		return visible.map(toWishList);
	}, [] as WishList[]);
}

export function usePriceChecks(wishId: string) {
	return useScopedLiveQuery(async () => {
		const locals = await db
			.table<LocalPriceCheck>('wishesPriceChecks')
			.where('wishId')
			.equals(wishId)
			.toArray();
		const visible = locals.filter((p) => !p.deletedAt);
		return visible
			.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime())
			.map(toPriceCheck);
	}, [] as PriceCheck[]);
}

// ─── Pure Filter Functions ────────────────────────────────

export function filterByStatus(wishes: Wish[], status: string): Wish[] {
	return wishes.filter((w) => w.status === status);
}

export function filterByPriority(wishes: Wish[], priority: string): Wish[] {
	return wishes.filter((w) => w.priority === priority);
}

export function filterByList(wishes: Wish[], listId: string | null): Wish[] {
	if (listId === null) return wishes.filter((w) => !w.listId);
	return wishes.filter((w) => w.listId === listId);
}

export function searchWishes(wishes: Wish[], query: string): Wish[] {
	if (!query.trim()) return wishes;
	const q = query.toLowerCase().trim();
	return wishes.filter(
		(w) =>
			w.title.toLowerCase().includes(q) ||
			w.description?.toLowerCase().includes(q) ||
			w.category?.toLowerCase().includes(q) ||
			w.tags.some((t) => t.toLowerCase().includes(q))
	);
}

export function getTotalEstimatedCost(wishes: Wish[]): number {
	return wishes.reduce((sum, w) => sum + (w.targetPrice ?? 0), 0);
}
