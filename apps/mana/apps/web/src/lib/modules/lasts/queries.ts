import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type { Last, LastStatus, LocalLast } from './types';

// ─── Type Converter ────────────────────────────────────────

export function toLast(local: LocalLast): Last {
	return {
		id: local.id,
		title: local.title,
		status: local.status,
		category: local.category,
		confidence: local.confidence,
		inferredFrom: local.inferredFrom,
		date: local.date,
		meaning: local.meaning,
		note: local.note,
		whatIKnewThen: local.whatIKnewThen,
		whatIKnowNow: local.whatIKnowNow,
		tenderness: local.tenderness,
		wouldReclaim: local.wouldReclaim,
		reclaimedAt: local.reclaimedAt,
		reclaimedNote: local.reclaimedNote,
		personIds: local.personIds ?? [],
		sharedWith: local.sharedWith,
		mediaIds: local.mediaIds ?? [],
		audioNoteId: local.audioNoteId,
		placeId: local.placeId,
		recognisedAt: local.recognisedAt ?? local.createdAt ?? new Date().toISOString(),
		isPinned: local.isPinned,
		isArchived: local.isArchived,
		visibility: local.visibility ?? 'private',
		unlistedToken: local.unlistedToken ?? '',
		unlistedExpiresAt: local.unlistedExpiresAt ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/**
 * All non-archived, non-deleted lasts in the active Space, sorted with
 * pinned first, then by date desc (suspected/confirmed) and reclaimed
 * pushed to the bottom.
 */
export function useAllLasts() {
	return useScopedLiveQuery(async () => {
		const visible = (await scopedForModule<LocalLast, string>('lasts', 'lasts').toArray()).filter(
			(l) => !l.deletedAt && !l.isArchived
		);
		const decrypted = await decryptRecords('lasts', visible);
		return decrypted.map(toLast).sort(compareLasts);
	}, [] as Last[]);
}

export function useLastsByStatus(status: LastStatus) {
	return useScopedLiveQuery(async () => {
		const visible = (await scopedForModule<LocalLast, string>('lasts', 'lasts').toArray()).filter(
			(l) => !l.deletedAt && !l.isArchived && l.status === status
		);
		const decrypted = await decryptRecords('lasts', visible);
		return decrypted.map(toLast).sort(compareLasts);
	}, [] as Last[]);
}

/**
 * Inbox = AI-inferred suggestions still pending review. A `Last` enters
 * the Inbox when the inference scanner writes it (status='suspected',
 * inferredFrom != null) and leaves it when the user either accepts
 * (clears inferredFrom) or dismisses (delete + cooldown).
 */
export function useInboxLasts() {
	return useScopedLiveQuery(async () => {
		const visible = (await scopedForModule<LocalLast, string>('lasts', 'lasts').toArray()).filter(
			(l) => !l.deletedAt && !l.isArchived && l.status === 'suspected' && l.inferredFrom != null
		);
		const decrypted = await decryptRecords('lasts', visible);
		// Newest scans first so users see the most recent inference batch.
		return decrypted.map(toLast).sort((a, b) => b.recognisedAt.localeCompare(a.recognisedAt));
	}, [] as Last[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

function compareLasts(a: Last, b: Last): number {
	if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
	// Reclaimed pushed to bottom
	const aReclaimed = a.status === 'reclaimed';
	const bReclaimed = b.status === 'reclaimed';
	if (aReclaimed !== bReclaimed) return aReclaimed ? 1 : -1;
	// Newest date first; fall back to createdAt
	const aKey = a.date ?? a.createdAt;
	const bKey = b.date ?? b.createdAt;
	return bKey.localeCompare(aKey);
}

export function searchLasts(lasts: Last[], query: string): Last[] {
	if (!query.trim()) return lasts;
	const q = query.toLowerCase();
	return lasts.filter((l) => {
		const haystack = [
			l.title,
			l.meaning,
			l.note,
			l.whatIKnewThen,
			l.whatIKnowNow,
			l.sharedWith,
			l.reclaimedNote,
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}
