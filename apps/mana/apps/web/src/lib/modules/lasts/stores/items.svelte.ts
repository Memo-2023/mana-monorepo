import { lastTable } from '../collections';
import { toLast } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import { runInferenceScan, recordDismissal, type ScanResult } from '../inference/scan';
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
	InferredFrom,
	Last,
	LastCategory,
	LastConfidence,
	LocalLast,
	WouldReclaim,
} from '../types';

function nowIso(): string {
	return new Date().toISOString();
}

function todayIsoDate(): string {
	return nowIso().slice(0, 10);
}

export const lastsStore = {
	/**
	 * Create a new "suspected" last — manually marked or AI-inferred. AI-inferred
	 * records pass `inferredFrom` so the inbox can show provenance.
	 */
	async createSuspected(data: {
		title: string;
		category?: LastCategory;
		confidence?: LastConfidence | null;
		date?: string | null;
		meaning?: string | null;
		note?: string | null;
		personIds?: string[];
		placeId?: string | null;
		inferredFrom?: InferredFrom | null;
	}): Promise<Last> {
		const id = crypto.randomUUID();
		const now = nowIso();
		const newLocal: LocalLast = {
			id,
			title: data.title,
			status: 'suspected',
			category: data.category ?? 'other',
			confidence: data.confidence ?? null,
			inferredFrom: data.inferredFrom ?? null,
			date: data.date ?? null,
			meaning: data.meaning ?? null,
			note: data.note ?? null,
			whatIKnewThen: null,
			whatIKnowNow: null,
			tenderness: null,
			wouldReclaim: null,
			reclaimedAt: null,
			reclaimedNote: null,
			personIds: data.personIds ?? [],
			sharedWith: null,
			mediaIds: [],
			audioNoteId: null,
			placeId: data.placeId ?? null,
			recognisedAt: now,
			isPinned: false,
			isArchived: false,
		};

		const plaintextSnapshot = toLast(newLocal);
		await encryptRecord('lasts', newLocal);
		await lastTable.add(newLocal);
		return plaintextSnapshot;
	},

	/**
	 * Create a confirmed last directly (skip suspected — used when the user
	 * already knows it was the last time, e.g. last day at the old job).
	 */
	async createConfirmed(data: {
		title: string;
		category?: LastCategory;
		date?: string;
		meaning?: string | null;
		note?: string | null;
		whatIKnewThen?: string | null;
		whatIKnowNow?: string | null;
		tenderness?: number | null;
		wouldReclaim?: WouldReclaim | null;
		personIds?: string[];
		placeId?: string | null;
	}): Promise<Last> {
		const id = crypto.randomUUID();
		const now = nowIso();
		const newLocal: LocalLast = {
			id,
			title: data.title,
			status: 'confirmed',
			category: data.category ?? 'other',
			confidence: 'certain',
			inferredFrom: null,
			date: data.date ?? todayIsoDate(),
			meaning: data.meaning ?? null,
			note: data.note ?? null,
			whatIKnewThen: data.whatIKnewThen ?? null,
			whatIKnowNow: data.whatIKnowNow ?? null,
			tenderness: data.tenderness ?? null,
			wouldReclaim: data.wouldReclaim ?? null,
			reclaimedAt: null,
			reclaimedNote: null,
			personIds: data.personIds ?? [],
			sharedWith: null,
			mediaIds: [],
			audioNoteId: null,
			placeId: data.placeId ?? null,
			recognisedAt: now,
			isPinned: false,
			isArchived: false,
		};

		const plaintextSnapshot = toLast(newLocal);
		await encryptRecord('lasts', newLocal);
		await lastTable.add(newLocal);
		return plaintextSnapshot;
	},

	async confirmLast(
		id: string,
		data: {
			date?: string;
			meaning?: string | null;
			whatIKnewThen?: string | null;
			whatIKnowNow?: string | null;
			tenderness?: number | null;
			wouldReclaim?: WouldReclaim | null;
		}
	) {
		const diff: Partial<LocalLast> = {
			status: 'confirmed',
			date: data.date ?? todayIsoDate(),
			confidence: 'certain',
			meaning: data.meaning ?? null,
			whatIKnewThen: data.whatIKnewThen ?? null,
			whatIKnowNow: data.whatIKnowNow ?? null,
			tenderness: data.tenderness ?? null,
			wouldReclaim: data.wouldReclaim ?? null,
			updatedAt: nowIso(),
		};
		await encryptRecord('lasts', diff);
		await lastTable.update(id, diff);
	},

	/**
	 * Mark a last as reclaimed — it happened again. Keeps the row in history
	 * but pushes it out of the main feed (queries sort reclaimed to the bottom).
	 */
	async reclaimLast(id: string, reclaimedNote: string | null = null) {
		const diff: Partial<LocalLast> = {
			status: 'reclaimed',
			reclaimedAt: nowIso(),
			reclaimedNote,
			updatedAt: nowIso(),
		};
		await encryptRecord('lasts', diff);
		await lastTable.update(id, diff);
	},

	async updateLast(
		id: string,
		data: Partial<
			Pick<
				LocalLast,
				| 'title'
				| 'category'
				| 'confidence'
				| 'date'
				| 'meaning'
				| 'note'
				| 'whatIKnewThen'
				| 'whatIKnowNow'
				| 'tenderness'
				| 'wouldReclaim'
				| 'personIds'
				| 'sharedWith'
				| 'mediaIds'
				| 'audioNoteId'
				| 'placeId'
				| 'isPinned'
				| 'isArchived'
			>
		>
	) {
		const diff: Partial<LocalLast> = {
			...data,
			updatedAt: nowIso(),
		};
		await encryptRecord('lasts', diff);
		await lastTable.update(id, diff);
	},

	async deleteLast(id: string) {
		await lastTable.update(id, {
			deletedAt: nowIso(),
			updatedAt: nowIso(),
		});
	},

	async togglePin(id: string) {
		const last = await lastTable.get(id);
		if (!last) return;
		await lastTable.update(id, {
			isPinned: !last.isPinned,
			updatedAt: nowIso(),
		});
	},

	async archiveLast(id: string) {
		await lastTable.update(id, {
			isArchived: true,
			updatedAt: nowIso(),
		});
	},

	// ── Inbox / Inference ──────────────────────────────────────

	/**
	 * Run the inference scanner and persist surviving candidates as
	 * suspected lasts with `inferredFrom` set. Returns the scan summary
	 * + the count actually written, so the UI can show "3 neue Vorschläge".
	 */
	async suggestLasts(): Promise<ScanResult & { written: number }> {
		const result = await runInferenceScan();
		const now = nowIso();
		let written = 0;

		for (const candidate of result.finalCandidates) {
			const id = crypto.randomUUID();
			const newLocal: LocalLast = {
				id,
				title: candidate.title,
				status: 'suspected',
				category: candidate.category,
				confidence: 'likely',
				inferredFrom: {
					tool: 'suggest_lasts',
					refTable: candidate.refTable,
					refId: candidate.refId,
					frequencyHint: candidate.frequencyHint,
					scannedAt: now,
				},
				date: candidate.suggestedDate,
				meaning: null,
				note: null,
				whatIKnewThen: null,
				whatIKnowNow: null,
				tenderness: null,
				wouldReclaim: null,
				reclaimedAt: null,
				reclaimedNote: null,
				personIds: [],
				sharedWith: null,
				mediaIds: [],
				audioNoteId: null,
				placeId: candidate.refTable === 'places' ? candidate.refId : null,
				recognisedAt: now,
				isPinned: false,
				isArchived: false,
			};

			await encryptRecord('lasts', newLocal);
			await lastTable.add(newLocal);
			written += 1;
		}

		return { ...result, written };
	},

	/**
	 * "Akzeptieren" from the Inbox — keep the entry as suspected but drop
	 * the inferredFrom marker so it leaves the Inbox view and lives in the
	 * normal feed alongside user-marked entries.
	 */
	async acceptCandidate(id: string) {
		await lastTable.update(id, {
			inferredFrom: null,
			updatedAt: nowIso(),
		});
	},

	/**
	 * "Verwerfen" from the Inbox — soft-delete the entry and record the
	 * dismissal in the cooldown table so the scanner doesn't re-suggest
	 * the same (refTable, refId) for COOLDOWN_DAYS.
	 */
	async dismissCandidate(id: string) {
		const last = await lastTable.get(id);
		if (last?.inferredFrom) {
			await recordDismissal(last.inferredFrom.refTable, last.inferredFrom.refId);
		}
		await this.deleteLast(id);
	},

	// ── Visibility / Unlisted-Sharing ──────────────────────────

	/**
	 * Change a last's visibility. Transitions to/from `unlisted` publish
	 * or revoke the server-side snapshot blob. Server is authoritative for
	 * the share token. Reclaimed lasts are blocked from going public —
	 * the unlisted resolver also rejects them defensively.
	 */
	async setVisibility(id: string, next: VisibilityLevel) {
		const existing = await lastTable.get(id);
		if (!existing) throw new Error(`Last ${id} not found`);
		const before: VisibilityLevel = existing.visibility ?? 'private';
		if (before === next) return;

		if (next === 'unlisted' && existing.status === 'reclaimed') {
			throw new Error('Aufgehobene Lasts können nicht öffentlich geteilt werden.');
		}

		const now = nowIso();
		const patch: Partial<LocalLast> = {
			visibility: next,
			visibilityChangedAt: now,
			visibilityChangedBy: getEffectiveUserId() ?? undefined,
			updatedAt: now,
		};

		if (next === 'unlisted') {
			const jwt = await authStore.getValidToken();
			if (!jwt) throw new Error('Nicht eingeloggt — Share-Link kann nicht erzeugt werden.');
			const blob = await buildUnlistedBlob('lasts', id);
			const spaceId =
				(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
			const { token } = await publishUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'lasts',
				recordId: id,
				spaceId,
				blob,
			});
			patch.unlistedToken = token;
			patch.unlistedExpiresAt = null;
		} else if (before === 'unlisted') {
			const jwt = await authStore.getValidToken();
			if (jwt) {
				try {
					await revokeUnlistedSnapshot({
						apiUrl: getManaApiUrl(),
						jwt,
						collection: 'lasts',
						recordId: id,
					});
				} catch {
					// Server may already have garbage-collected the row; the local
					// state-flip below is still correct.
				}
			}
			patch.unlistedToken = '';
			patch.unlistedExpiresAt = null;
		}

		await lastTable.update(id, patch);
	},

	/**
	 * Rotate the share token for an unlisted last. Useful when the user
	 * suspects the link leaked — old URL stops working immediately, new
	 * one carries the same expiry (if any) for continuity.
	 */
	async regenerateUnlistedToken(id: string) {
		const existing = await lastTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return null;
		const jwt = await authStore.getValidToken();
		if (!jwt) return null;

		try {
			await revokeUnlistedSnapshot({
				apiUrl: getManaApiUrl(),
				jwt,
				collection: 'lasts',
				recordId: id,
			});
		} catch {
			// Same defensive behavior as setVisibility — proceed even if the
			// old snapshot is already gone server-side.
		}

		const blob = await buildUnlistedBlob('lasts', id);
		const spaceId =
			(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
		const { token } = await publishUnlistedSnapshot({
			apiUrl: getManaApiUrl(),
			jwt,
			collection: 'lasts',
			recordId: id,
			spaceId,
			blob,
			expiresAt: existing.unlistedExpiresAt ? new Date(existing.unlistedExpiresAt) : undefined,
		});
		await lastTable.update(id, {
			unlistedToken: token,
			updatedAt: nowIso(),
		});
		return token;
	},

	/**
	 * Update the auto-revoke deadline of an unlisted snapshot. `null`
	 * means "never expires". The server re-publishes the same blob with
	 * the new TTL.
	 */
	async setUnlistedExpiry(id: string, expiresAt: Date | null) {
		const existing = await lastTable.get(id);
		if (!existing || existing.visibility !== 'unlisted') return;
		const jwt = await authStore.getValidToken();
		if (!jwt) return;

		const blob = await buildUnlistedBlob('lasts', id);
		const spaceId =
			(existing as unknown as { spaceId?: string }).spaceId ?? getActiveSpace()?.id ?? '';
		const { token } = await publishUnlistedSnapshot({
			apiUrl: getManaApiUrl(),
			jwt,
			collection: 'lasts',
			recordId: id,
			spaceId,
			blob,
			expiresAt: expiresAt ?? undefined,
		});
		await lastTable.update(id, {
			unlistedToken: token,
			unlistedExpiresAt: expiresAt ? expiresAt.toISOString() : null,
			updatedAt: nowIso(),
		});
	},
};
