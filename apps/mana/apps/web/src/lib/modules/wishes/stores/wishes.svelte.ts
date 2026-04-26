/**
 * Wishes Store — Mutations Only
 *
 * All reads are handled by liveQuery hooks in queries.ts.
 */

import { wishTable } from '../collections';
import { toWish } from '../queries';
import type { LocalWish, WishPriority } from '../types';
import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';

export const wishesStore = {
	async create(data: {
		title: string;
		description?: string;
		listId?: string | null;
		priority?: WishPriority;
		targetPrice?: number;
		currency?: string;
		productUrls?: string[];
		imageUrl?: string;
		category?: string;
		tags?: string[];
	}) {
		const existing = await wishTable.toArray();
		const active = existing.filter((w) => !w.deletedAt);

		const newLocal: LocalWish = {
			id: crypto.randomUUID(),
			title: data.title,
			description: data.description ?? null,
			listId: data.listId ?? null,
			priority: data.priority ?? 'medium',
			targetPrice: data.targetPrice ?? null,
			currency: data.currency ?? 'EUR',
			productUrls: data.productUrls ?? [],
			imageUrl: data.imageUrl ?? null,
			category: data.category ?? null,
			status: 'active',
			tags: data.tags ?? [],
			notes: [],
			order: active.length,
		};

		const plaintextSnapshot = toWish(newLocal);
		await encryptRecord('wishesItems', newLocal);
		await wishTable.add(newLocal);
		emitDomainEvent('WishCreated', 'wishes', 'wishesItems', newLocal.id, {
			wishId: newLocal.id,
			title: data.title,
			listId: data.listId,
		});
		return plaintextSnapshot;
	},

	async update(
		id: string,
		data: Partial<
			Pick<
				LocalWish,
				| 'title'
				| 'description'
				| 'priority'
				| 'status'
				| 'targetPrice'
				| 'currency'
				| 'productUrls'
				| 'imageUrl'
				| 'category'
				| 'tags'
				| 'listId'
			>
		>
	) {
		const diff: Partial<LocalWish> = {
			...data,
		};
		await encryptRecord('wishesItems', diff);
		await wishTable.update(id, diff);
	},

	async fulfill(id: string) {
		await wishTable.update(id, {
			status: 'fulfilled',
		});
		emitDomainEvent('WishFulfilled', 'wishes', 'wishesItems', id, { wishId: id });
	},

	async archive(id: string) {
		await wishTable.update(id, {
			status: 'archived',
		});
	},

	async delete(id: string) {
		await wishTable.update(id, {
			deletedAt: new Date().toISOString(),
		});
	},

	async addNote(wishId: string, content: string) {
		const wish = await wishTable.get(wishId);
		if (!wish) return;
		const now = new Date().toISOString();
		const note = { id: crypto.randomUUID(), content, createdAt: now };
		await wishTable.update(wishId, {
			notes: [...wish.notes, note],
		});
	},

	async addProductUrl(wishId: string, url: string) {
		const wish = await wishTable.get(wishId);
		if (!wish) return;
		if (wish.productUrls.includes(url)) return;
		await wishTable.update(wishId, {
			productUrls: [...wish.productUrls, url],
		});
	},

	async removeProductUrl(wishId: string, url: string) {
		const wish = await wishTable.get(wishId);
		if (!wish) return;
		await wishTable.update(wishId, {
			productUrls: wish.productUrls.filter((u) => u !== url),
		});
	},

	async reorder(orderedIds: string[]) {
		const now = new Date().toISOString();
		for (let i = 0; i < orderedIds.length; i++) {
			await wishTable.update(orderedIds[i], { order: i });
		}
	},
};
