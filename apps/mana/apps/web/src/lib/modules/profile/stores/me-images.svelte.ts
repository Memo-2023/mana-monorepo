/**
 * Me-Images store — mutation-only service.
 *
 * Reads happen via liveQuery helpers in queries.ts. Writes go through
 * this store so encryption (`label`, `tags`) and primary-slot swapping
 * stay in one place.
 *
 * Plan: docs/plans/me-images-and-reference-generation.md M1.
 */

import { encryptRecord } from '$lib/data/crypto';
import { emitDomainEvent } from '$lib/data/events';
import { meImagesTable } from '../collections';
import { toMeImage } from '../types';
import type {
	LocalMeImage,
	MeImage,
	MeImageKind,
	MeImagePrimarySlot,
	MeImageUsage,
} from '../types';

export interface CreateMeImageInput {
	kind: MeImageKind;
	mediaId: string;
	storagePath: string;
	publicUrl: string;
	thumbnailUrl?: string | null;
	width: number;
	height: number;
	label?: string;
	tags?: string[];
	usage?: Partial<MeImageUsage>;
	primaryFor?: MeImagePrimarySlot | null;
}

/**
 * Usage default on upload: `aiReference=false` (Opt-in per image is
 * the eigentliche Zustimmungsebene — plan decision #5) and
 * `showInProfile=true` so the image can back the avatar fallback even
 * before the user explicitly picks a primary.
 */
function defaultUsage(override?: Partial<MeImageUsage>): MeImageUsage {
	return {
		aiReference: override?.aiReference ?? false,
		showInProfile: override?.showInProfile ?? true,
	};
}

export const meImagesStore = {
	async createMeImage(input: CreateMeImageInput): Promise<MeImage> {
		const newLocal: LocalMeImage = {
			id: crypto.randomUUID(),
			kind: input.kind,
			label: input.label,
			mediaId: input.mediaId,
			storagePath: input.storagePath,
			publicUrl: input.publicUrl,
			thumbnailUrl: input.thumbnailUrl ?? null,
			width: input.width,
			height: input.height,
			tags: input.tags ?? [],
			usage: defaultUsage(input.usage),
			primaryFor: input.primaryFor ?? null,
		};
		const snapshot = toMeImage({ ...newLocal });
		await encryptRecord('meImages', newLocal);
		await meImagesTable.add(newLocal);
		emitDomainEvent('MeImageAdded', 'profile', 'meImages', newLocal.id, {
			meImageId: newLocal.id,
			kind: input.kind,
			primaryFor: newLocal.primaryFor,
		});
		return snapshot;
	},

	async updateMeImage(
		id: string,
		patch: Partial<Pick<LocalMeImage, 'label' | 'tags' | 'kind' | 'usage'>>
	): Promise<void> {
		const wrapped = { ...patch } as Record<string, unknown>;
		await encryptRecord('meImages', wrapped);
		await meImagesTable.update(id, {
			...wrapped,
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Flip the per-image AI opt-in. Kept as its own method because
	 * it's the hottest privacy-relevant toggle in the Settings UI and
	 * warrants a dedicated event for audit.
	 */
	async setAiReferenceEnabled(id: string, enabled: boolean): Promise<void> {
		const existing = await meImagesTable.get(id);
		if (!existing) return;
		const nextUsage: MeImageUsage = {
			...defaultUsage(existing.usage),
			aiReference: enabled,
		};
		await meImagesTable.update(id, {
			usage: nextUsage,
			updatedAt: new Date().toISOString(),
		});
		emitDomainEvent('MeImageAiReferenceToggled', 'profile', 'meImages', id, {
			meImageId: id,
			enabled,
		});
	},

	/**
	 * Claim a primary slot for `id`, clearing any previous holder of
	 * the same slot in the same transaction. At most one image per
	 * slot is ever active — the query layer relies on this invariant.
	 *
	 * Pass `null` as the second argument to unset the slot on `id`
	 * without claiming it for anyone else.
	 */
	async setPrimary(id: string, slot: MeImagePrimarySlot | null): Promise<void> {
		const nowIso = new Date().toISOString();
		await meImagesTable.db.transaction('rw', meImagesTable, async () => {
			if (slot === null) {
				await meImagesTable.update(id, { primaryFor: null, updatedAt: nowIso });
				return;
			}
			// Clear any current holder of this slot (usually zero or one).
			const current = await meImagesTable.where('primaryFor').equals(slot).toArray();
			for (const row of current) {
				if (row.id === id) continue;
				await meImagesTable.update(row.id, { primaryFor: null, updatedAt: nowIso });
			}
			await meImagesTable.update(id, { primaryFor: slot, updatedAt: nowIso });
		});
		emitDomainEvent('MeImagePrimaryChanged', 'profile', 'meImages', id, {
			meImageId: id,
			slot,
		});
	},

	async deleteMeImage(id: string): Promise<void> {
		const nowIso = new Date().toISOString();
		await meImagesTable.update(id, {
			deletedAt: nowIso,
			updatedAt: nowIso,
			// Dropping a primary-holder silently leaves the slot empty;
			// the UI's primary-picker will prompt the user to pick a new
			// one next time it renders.
			primaryFor: null,
		});
		emitDomainEvent('MeImageDeleted', 'profile', 'meImages', id, { meImageId: id });
	},
};
