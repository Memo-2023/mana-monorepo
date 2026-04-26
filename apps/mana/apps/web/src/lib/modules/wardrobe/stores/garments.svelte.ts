/**
 * Garments store — mutation-only service.
 *
 * Reads happen via `queries.ts`; this module owns the write path so
 * encryption + domain events stay in one place. The Dexie creating-hook
 * stamps `spaceId`, `authorId`, `visibility` automatically — wardrobe
 * is NOT in USER_LEVEL_TABLES.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { wardrobeGarmentsTable } from '../collections';
import { toGarment } from '../types';
import type { Garment, GarmentCategory, LocalWardrobeGarment } from '../types';

export interface CreateGarmentInput {
	name: string;
	category: GarmentCategory;
	mediaIds: string[];
	brand?: string | null;
	color?: string | null;
	size?: string | null;
	material?: string | null;
	tags?: string[];
	notes?: string | null;
	purchasedAt?: string | null;
	priceCents?: number | null;
	currency?: string | null;
}

export const wardrobeGarmentsStore = {
	async createGarment(input: CreateGarmentInput): Promise<Garment> {
		if (input.mediaIds.length === 0) {
			throw new Error('Garment needs at least one photo');
		}
		const newLocal: LocalWardrobeGarment = {
			id: crypto.randomUUID(),
			name: input.name,
			category: input.category,
			mediaIds: input.mediaIds,
			brand: input.brand ?? null,
			color: input.color ?? null,
			size: input.size ?? null,
			material: input.material ?? null,
			tags: input.tags ?? [],
			notes: input.notes ?? null,
			purchasedAt: input.purchasedAt ?? null,
			priceCents: input.priceCents ?? null,
			currency: input.currency ?? null,
			wearCount: 0,
			lastWornAt: null,
		};
		const snapshot = toGarment({ ...newLocal });
		await encryptRecord('wardrobeGarments', newLocal);
		await wardrobeGarmentsTable.add(newLocal);
		emitDomainEvent('WardrobeGarmentAdded', 'wardrobe', 'wardrobeGarments', newLocal.id, {
			garmentId: newLocal.id,
			category: input.category,
		});
		return snapshot;
	},

	async updateGarment(
		id: string,
		patch: Partial<
			Pick<
				LocalWardrobeGarment,
				| 'name'
				| 'category'
				| 'mediaIds'
				| 'brand'
				| 'color'
				| 'size'
				| 'material'
				| 'tags'
				| 'notes'
				| 'purchasedAt'
				| 'priceCents'
				| 'currency'
			>
		>
	): Promise<void> {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('wardrobeGarments', wrapped);
		await wardrobeGarmentsTable.update(id, wrapped);
	},

	/**
	 * Mark a garment as worn today. Bumps the wear count + stamps
	 * `lastWornAt`. The UI surfaces this as a one-tap button in the
	 * detail view; M7 adds it to the card too.
	 */
	async markWornToday(id: string): Promise<void> {
		const existing = await wardrobeGarmentsTable.get(id);
		if (!existing) return;
		const today = new Date().toISOString().slice(0, 10);
		await wardrobeGarmentsTable.update(id, {
			wearCount: (existing.wearCount ?? 0) + 1,
			lastWornAt: today,
		});
		emitDomainEvent('WardrobeGarmentWorn', 'wardrobe', 'wardrobeGarments', id, {
			garmentId: id,
			wearCount: (existing.wearCount ?? 0) + 1,
		});
	},

	async archiveGarment(id: string, archived: boolean): Promise<void> {
		await wardrobeGarmentsTable.update(id, {
			isArchived: archived,
		});
	},

	async deleteGarment(id: string): Promise<void> {
		const nowIso = new Date().toISOString();
		await wardrobeGarmentsTable.update(id, {
			deletedAt: nowIso,
		});
		emitDomainEvent('WardrobeGarmentDeleted', 'wardrobe', 'wardrobeGarments', id, {
			garmentId: id,
		});
	},
};
