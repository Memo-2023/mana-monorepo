import { augurEntriesTable } from '../collections';
import { toAugurEntry } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import {
	publishUnlistedSnapshot,
	revokeUnlistedSnapshot,
	type VisibilityLevel,
} from '@mana/shared-privacy';
import { buildUnlistedBlob } from '$lib/data/unlisted/resolvers';
import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from '$lib/api/config';
import { getActiveSpace } from '$lib/data/scope';
import { getEffectiveUserId } from '$lib/data/current-user';
import type {
	AugurEntry,
	AugurKind,
	AugurOutcome,
	AugurSourceCategory,
	AugurVibe,
	LocalAugurEntry,
} from '../types';

function todayIsoDate(): string {
	return new Date().toISOString().slice(0, 10);
}

export const augurStore = {
	async createEntry(data: {
		kind: AugurKind;
		source: string;
		sourceCategory: AugurSourceCategory;
		claim: string;
		vibe: AugurVibe;
		feltMeaning?: string | null;
		expectedOutcome?: string | null;
		expectedBy?: string | null;
		probability?: number | null;
		encounteredAt?: string;
		tags?: string[];
		relatedDreamId?: string | null;
		relatedDecisionId?: string | null;
		livingOracleSnapshot?: string | null;
		isPrivate?: boolean;
	}): Promise<AugurEntry> {
		const id = crypto.randomUUID();
		const newLocal: LocalAugurEntry = {
			id,
			kind: data.kind,
			source: data.source,
			sourceCategory: data.sourceCategory,
			claim: data.claim,
			vibe: data.vibe,
			feltMeaning: data.feltMeaning ?? null,
			expectedOutcome: data.expectedOutcome ?? null,
			expectedBy: data.expectedBy ?? null,
			probability: data.probability ?? null,
			outcome: 'open',
			outcomeNote: null,
			resolvedAt: null,
			encounteredAt: data.encounteredAt ?? todayIsoDate(),
			tags: data.tags ?? [],
			relatedDreamId: data.relatedDreamId ?? null,
			relatedDecisionId: data.relatedDecisionId ?? null,
			livingOracleSnapshot: data.livingOracleSnapshot ?? null,
			isPrivate: data.isPrivate ?? true,
			isArchived: false,
			visibility: 'private',
		};

		const plaintextSnapshot = toAugurEntry(newLocal);
		await encryptRecord('augurEntries', newLocal);
		await augurEntriesTable.add(newLocal);
		return plaintextSnapshot;
	},

	async updateEntry(
		id: string,
		data: Partial<
			Pick<
				LocalAugurEntry,
				| 'source'
				| 'sourceCategory'
				| 'claim'
				| 'vibe'
				| 'feltMeaning'
				| 'expectedOutcome'
				| 'expectedBy'
				| 'probability'
				| 'tags'
				| 'isPrivate'
				| 'relatedDreamId'
				| 'relatedDecisionId'
			>
		>
	) {
		const diff: Partial<LocalAugurEntry> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('augurEntries', diff);
		await augurEntriesTable.update(id, diff);
	},

	async resolveEntry(id: string, outcome: AugurOutcome, note?: string | null) {
		const diff: Partial<LocalAugurEntry> = {
			outcome,
			outcomeNote: note ?? null,
			resolvedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('augurEntries', diff);
		await augurEntriesTable.update(id, diff);
	},

	async archiveEntry(id: string) {
		await augurEntriesTable.update(id, {
			isArchived: true,
			updatedAt: new Date().toISOString(),
		});
	},

	async deleteEntry(id: string) {
		const existing = await augurEntriesTable.get(id);
		// Revoke any active share-link before tombstoning so a recipient
		// reloading the link gets 410 Gone instead of stale data.
		if (existing?.visibility === 'unlisted' && existing.unlistedToken) {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				try {
					await revokeUnlistedSnapshot({
						apiUrl: getManaApiUrl(),
						jwt,
						collection: 'augurEntries',
						recordId: id,
					});
				} catch (e) {
					console.error('[augur] revoke on delete failed', e);
				}
			}
		}

		await augurEntriesTable.update(id, {
			deletedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	},

	/**
	 * Flip the visibility level. Coordinates with the server-side
	 * unlisted-snapshots table — same pattern as library/calendar.
	 * Server is authoritative for the token.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await augurEntriesTable.get(id);
		if (!existing) throw new Error(`Augur entry ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'private';
		if (before === next) return;

		const now = new Date().toISOString();
		const patch: Partial<LocalAugurEntry> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId() ?? undefined,
			updatedAt: now,
		};

		if (next === 'unlisted') {
			const blob = await buildUnlistedBlob('augurEntries', id);
			const jwt = await authStore.getValidToken();
			if (!jwt) throw new Error('Nicht eingeloggt');
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'augurEntries',
				recordId: id,
				spaceId,
				blob,
			});
			patch.unlistedToken = token;
			patch.unlistedExpiresAt = null;
		} else if (before === 'unlisted') {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				await revokeUnlistedSnapshot({
					apiUrl: getManaApiUrl(),
					jwt,
					collection: 'augurEntries',
					recordId: id,
				});
			}
			patch.unlistedToken = undefined;
			patch.unlistedExpiresAt = null;
		}

		await augurEntriesTable.update(id, patch);
	},

	/**
	 * Force-regenerate the unlisted token. Revoke + republish — server
	 * gives back a new token because the prior row is marked revoked.
	 * UI intent: "the old link is leaked or I want a clean slate".
	 * Preserves the existing expiry so a rotation doesn't extend the
	 * link's lifetime.
	 */
	async regenerateUnlistedToken(id: string) {
		const existing = await augurEntriesTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return null;
		const jwt = await authStore.getValidToken();
		if (!jwt) return null;
		try {
			await revokeUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'augurEntries',
				recordId: id,
			});
			const blob = await buildUnlistedBlob('augurEntries', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'augurEntries',
				recordId: id,
				spaceId,
				blob,
				expiresAt: existing.unlistedExpiresAt ? new Date(existing.unlistedExpiresAt) : undefined,
			});
			await augurEntriesTable.update(id, {
				unlistedToken: token,
				updatedAt: new Date().toISOString(),
			});
			return token;
		} catch (e) {
			console.error('[augur] regenerate failed', e);
			return null;
		}
	},

	/**
	 * Set or clear the unlisted-share expiry. Re-publishes with the new
	 * `expiresAt` and mirrors locally so the picker stays in sync.
	 * Same pattern as calendar/library/places (M8.5).
	 */
	async setUnlistedExpiry(id: string, expiresAt: Date | null) {
		const existing = await augurEntriesTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		const jwt = await authStore.getValidToken();
		if (!jwt) return;
		try {
			const blob = await buildUnlistedBlob('augurEntries', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'augurEntries',
				recordId: id,
				spaceId,
				blob,
				expiresAt,
			});
			await augurEntriesTable.update(id, {
				unlistedExpiresAt: expiresAt ? expiresAt.toISOString() : null,
				updatedAt: new Date().toISOString(),
			});
		} catch (e) {
			console.error('[augur] setUnlistedExpiry failed', e);
		}
	},
};
