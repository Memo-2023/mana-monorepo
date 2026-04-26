import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import { isDue } from './lib/reminders';
import type { AugurEntry, AugurKind, LocalAugurEntry } from './types';

// ─── Type Converter ────────────────────────────────────────

export function toAugurEntry(local: LocalAugurEntry): AugurEntry {
	return {
		id: local.id,
		kind: local.kind,
		source: local.source,
		sourceCategory: local.sourceCategory,
		claim: local.claim,
		vibe: local.vibe,
		feltMeaning: local.feltMeaning ?? null,
		expectedOutcome: local.expectedOutcome ?? null,
		expectedBy: local.expectedBy ?? null,
		probability: local.probability ?? null,
		outcome: local.outcome,
		outcomeNote: local.outcomeNote ?? null,
		resolvedAt: local.resolvedAt ?? null,
		encounteredAt: local.encounteredAt,
		tags: local.tags ?? [],
		relatedDreamId: local.relatedDreamId ?? null,
		relatedDecisionId: local.relatedDecisionId ?? null,
		livingOracleSnapshot: local.livingOracleSnapshot ?? null,
		isPrivate: local.isPrivate,
		isArchived: local.isArchived,
		visibility: local.visibility ?? 'private',
		unlistedToken: local.unlistedToken ?? '',
		unlistedExpiresAt: local.unlistedExpiresAt ?? null,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: deriveUpdatedAt(local),
	};
}

// ─── Live Queries ──────────────────────────────────────────

function visibleScoped() {
	return scopedForModule<LocalAugurEntry, string>('augur', 'augurEntries').toArray();
}

export function useAllAugurEntries() {
	return useScopedLiveQuery(async () => {
		const visible = (await visibleScoped()).filter((e) => !e.deletedAt && !e.isArchived);
		const decrypted = await decryptRecords('augurEntries', visible);
		return decrypted
			.map(toAugurEntry)
			.sort((a, b) => b.encounteredAt.localeCompare(a.encounteredAt));
	}, [] as AugurEntry[]);
}

export function useAugurEntriesByKind(kind: AugurKind) {
	return useScopedLiveQuery(async () => {
		const visible = (await visibleScoped()).filter(
			(e) => !e.deletedAt && !e.isArchived && e.kind === kind
		);
		const decrypted = await decryptRecords('augurEntries', visible);
		return decrypted
			.map(toAugurEntry)
			.sort((a, b) => b.encounteredAt.localeCompare(a.encounteredAt));
	}, [] as AugurEntry[]);
}

export function useUnresolvedAugurEntries() {
	return useScopedLiveQuery(async () => {
		const visible = (await visibleScoped()).filter(
			(e) => !e.deletedAt && !e.isArchived && e.outcome === 'open'
		);
		const decrypted = await decryptRecords('augurEntries', visible);
		return decrypted
			.map(toAugurEntry)
			.sort((a, b) => b.encounteredAt.localeCompare(a.encounteredAt));
	}, [] as AugurEntry[]);
}

/**
 * Entries whose reminder date has passed but `outcome` is still 'open'.
 * Drives the DueBanner (M3) and the inbox card.
 *
 * Reminder date = `expectedBy` when set, else `encounteredAt + 30 days`.
 * Logic centralised in `lib/reminders.ts` so the mana-notify pipeline
 * later derives the same set without duplicating the rule.
 */
export function useDueForReveal() {
	return useScopedLiveQuery(async () => {
		const visible = (await visibleScoped()).filter(
			(e) => !e.deletedAt && !e.isArchived && e.outcome === 'open'
		);
		const decrypted = await decryptRecords('augurEntries', visible);
		return decrypted
			.map(toAugurEntry)
			.filter((e) => isDue(e))
			.sort((a, b) =>
				(a.expectedBy ?? a.encounteredAt).localeCompare(b.expectedBy ?? b.encounteredAt)
			);
	}, [] as AugurEntry[]);
}

// ─── Pure Helpers ──────────────────────────────────────────

export function searchAugurEntries(entries: AugurEntry[], query: string): AugurEntry[] {
	if (!query.trim()) return entries;
	const q = query.toLowerCase();
	return entries.filter((e) => {
		const haystack = [e.source, e.claim, e.feltMeaning, e.expectedOutcome, e.outcomeNote]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}

export function groupByKind(entries: AugurEntry[]): Record<AugurKind, AugurEntry[]> {
	const groups: Record<AugurKind, AugurEntry[]> = { omen: [], fortune: [], hunch: [] };
	for (const e of entries) groups[e.kind].push(e);
	return groups;
}
