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
import { scopedForModule, getActiveSpace } from '$lib/data/scope';
import { profileService } from '$lib/api/profile';
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
	/**
	 * Override the auto-stamped spaceId. Only the legacy-avatar
	 * migration needs this — it must pin the pre-M1 `auth.users.image`
	 * explicitly into the user's personal space regardless of which
	 * space happens to be active when the user first visits the route.
	 * Regular upload paths leave this unset and let the Dexie hook
	 * stamp the active space.
	 */
	spaceId?: string;
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

/**
 * After any primary-avatar change in the **personal** space, push the
 * current holder's publicUrl back to Better Auth so `auth.users.image`
 * stays in lockstep. Plan M2.5 — this is the only path by which
 * auth.users.image ever gets written from now on.
 *
 * After v40 (space-scope migration), avatar-primary is per-space; only
 * the personal-space holder represents the user's global SSO identity.
 * A primary-avatar change inside a brand/club/family/team/practice
 * space is local to that space and must NOT overwrite the Better Auth
 * record — otherwise switching into a brand space and picking a new
 * avatar would leak into the user's navigation/SSO identity elsewhere.
 *
 * Best-effort: failures are logged and swallowed. The meImages row is
 * authoritative for the app's own avatar rendering, so a stale
 * auth.users.image is a cross-session degradation, not data loss.
 */
async function syncAvatarToAuth(): Promise<void> {
	try {
		const active = getActiveSpace();
		if (active?.type !== 'personal') return;
		const rows = await scopedForModule<LocalMeImage, string>('profile', 'meImages')
			.and((row) => row.primaryFor === 'avatar')
			.toArray();
		const holder = rows.find((row) => !row.deletedAt);
		const nextImage = holder?.publicUrl ?? '';
		await profileService.updateProfile({ image: nextImage });
	} catch (err) {
		console.error('[profile] syncing avatar to Better Auth failed', err);
	}
}

/**
 * Internal: swap the primary holder of `slot` to `id` (or clear it
 * when id is null) in one transaction — *within the active space only*.
 * Extracted so `setPrimary` can reuse it when avatar silently follows
 * face-ref. After v40, "primary slot" is per-space; a setPrimary in
 * Brand-space must not clear Personal-space's holder.
 */
async function setPrimaryInTx(id: string | null, slot: MeImagePrimarySlot): Promise<void> {
	const nowIso = new Date().toISOString();
	await meImagesTable.db.transaction('rw', meImagesTable, async () => {
		const current = await scopedForModule<LocalMeImage, string>('profile', 'meImages')
			.and((row) => row.primaryFor === slot)
			.toArray();
		for (const row of current) {
			if (row.id === id) continue;
			await meImagesTable.update(row.id, { primaryFor: null, updatedAt: nowIso });
		}
		if (id !== null) {
			await meImagesTable.update(id, { primaryFor: slot, updatedAt: nowIso });
		}
	});
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
		// Pre-stamp the spaceId so the Dexie creating-hook leaves it
		// alone. Only the legacy-avatar migration uses this — regular
		// uploads let the hook stamp the active space.
		if (input.spaceId !== undefined) {
			newLocal.spaceId = input.spaceId;
		}
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
	 *
	 * The `avatar` slot is coupled to `face-ref`: setting a new
	 * face-ref also claims the avatar on the same row (plan M2.5
	 * decision — keeps auth.users.image in lockstep with the user's
	 * current reference face without a second UI control). Explicit
	 * avatar-only setPrimary calls (e.g. the legacy migration
	 * bootstrap) still work and only touch the avatar slot.
	 */
	async setPrimary(id: string, slot: MeImagePrimarySlot | null): Promise<void> {
		if (slot === null) {
			// Clear whatever this row currently holds. If it was the
			// avatar, we also need to sync that out to Better Auth.
			const existing = await meImagesTable.get(id);
			const wasAvatar = existing?.primaryFor === 'avatar';
			const nowIso = new Date().toISOString();
			await meImagesTable.update(id, { primaryFor: null, updatedAt: nowIso });
			emitDomainEvent('MeImagePrimaryChanged', 'profile', 'meImages', id, {
				meImageId: id,
				slot: null,
			});
			if (wasAvatar) await syncAvatarToAuth();
			return;
		}

		await setPrimaryInTx(id, slot);
		// Silent twin: a fresh face-ref is also the fresh avatar.
		if (slot === 'face-ref') {
			await setPrimaryInTx(id, 'avatar');
		}
		emitDomainEvent('MeImagePrimaryChanged', 'profile', 'meImages', id, {
			meImageId: id,
			slot,
		});
		if (slot === 'avatar' || slot === 'face-ref') {
			await syncAvatarToAuth();
		}
	},

	async deleteMeImage(id: string): Promise<void> {
		const existing = await meImagesTable.get(id);
		const wasAvatar = existing?.primaryFor === 'avatar';
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
		if (wasAvatar) await syncAvatarToAuth();
	},
};
