/**
 * Reactive queries + pure helpers for the Writing module.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { deriveUpdatedAt } from '$lib/data/sync';
import { decryptRecords } from '$lib/data/crypto';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import type {
	LocalDraft,
	LocalDraftVersion,
	LocalGeneration,
	LocalWritingStyle,
	Draft,
	DraftVersion,
	Generation,
	WritingStyle,
	DraftKind,
	DraftStatus,
} from './types';

// ─── Type Converters ─────────────────────────────────────

export function toDraft(local: LocalDraft): Draft {
	const now = new Date().toISOString();
	return {
		id: local.id,
		kind: local.kind,
		status: local.status,
		title: local.title,
		briefing: local.briefing,
		styleId: local.styleId ?? null,
		styleOverrides: local.styleOverrides ?? null,
		references: local.references ?? [],
		currentVersionId: local.currentVersionId ?? null,
		publishedTo: local.publishedTo ?? [],
		isFavorite: local.isFavorite ?? false,
		visibility: local.visibility ?? 'space',
		unlistedToken: local.unlistedToken ?? null,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

export function toDraftVersion(local: LocalDraftVersion): DraftVersion {
	const now = new Date().toISOString();
	return {
		id: local.id,
		draftId: local.draftId,
		versionNumber: local.versionNumber,
		content: local.content,
		wordCount: local.wordCount ?? 0,
		generationId: local.generationId ?? null,
		isAiGenerated: local.isAiGenerated ?? false,
		parentVersionId: local.parentVersionId ?? null,
		summary: local.summary ?? null,
		createdAt: local.createdAt ?? now,
	};
}

export function toGeneration(local: LocalGeneration): Generation {
	const now = new Date().toISOString();
	return {
		id: local.id,
		draftId: local.draftId,
		kind: local.kind,
		status: local.status,
		prompt: local.prompt,
		provider: local.provider,
		model: local.model ?? null,
		params: local.params ?? null,
		inputSelection: local.inputSelection ?? null,
		output: local.output ?? null,
		outputVersionId: local.outputVersionId ?? null,
		startedAt: local.startedAt ?? null,
		completedAt: local.completedAt ?? null,
		durationMs: local.durationMs ?? null,
		tokenUsage: local.tokenUsage ?? null,
		error: local.error ?? null,
		missionId: local.missionId ?? null,
		createdAt: local.createdAt ?? now,
	};
}

export function toWritingStyle(local: LocalWritingStyle): WritingStyle {
	const now = new Date().toISOString();
	return {
		id: local.id,
		name: local.name,
		description: local.description,
		source: local.source,
		presetId: local.presetId ?? null,
		samples: local.samples ?? [],
		extractedPrinciples: local.extractedPrinciples ?? null,
		isSpaceDefault: local.isSpaceDefault ?? false,
		isFavorite: local.isFavorite ?? false,
		createdAt: local.createdAt ?? now,
		updatedAt: deriveUpdatedAt(local),
	};
}

// ─── Live Queries ─────────────────────────────────────────

export function useAllDrafts() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalDraft, string>('writing', 'writingDrafts').toArray();
		const visible = locals.filter((d) => !d.deletedAt);
		const decrypted = await decryptRecords('writingDrafts', visible);
		return decrypted.map(toDraft);
	}, [] as Draft[]);
}

export function useDraft(id: string) {
	return useScopedLiveQuery(
		async () => {
			if (!id) return null;
			const row = await db.table<LocalDraft>('writingDrafts').get(id);
			if (!row || row.deletedAt) return null;
			const [decrypted] = await decryptRecords('writingDrafts', [row]);
			return decrypted ? toDraft(decrypted) : null;
		},
		null as Draft | null
	);
}

export function useVersionsForDraft(draftId: string) {
	return useScopedLiveQuery(async () => {
		if (!draftId) return [] as DraftVersion[];
		const rows = await db
			.table<LocalDraftVersion>('writingDraftVersions')
			.where('draftId')
			.equals(draftId)
			.toArray();
		const visible = rows.filter((v) => !v.deletedAt);
		const decrypted = await decryptRecords('writingDraftVersions', visible);
		return decrypted.map(toDraftVersion).sort((a, b) => a.versionNumber - b.versionNumber);
	}, [] as DraftVersion[]);
}

export function useVersion(versionId: string) {
	return useScopedLiveQuery(
		async () => {
			if (!versionId) return null;
			const row = await db.table<LocalDraftVersion>('writingDraftVersions').get(versionId);
			if (!row || row.deletedAt) return null;
			const [decrypted] = await decryptRecords('writingDraftVersions', [row]);
			return decrypted ? toDraftVersion(decrypted) : null;
		},
		null as DraftVersion | null
	);
}

/**
 * Live-track a draft's *current* version by following the pointer on the
 * draft row. Re-runs whenever either the draft or the version table
 * changes — so flipping `currentVersionId` via `restoreVersion` shows up
 * automatically in the editor.
 */
export function useCurrentVersionForDraft(draftId: string) {
	return useScopedLiveQuery(
		async () => {
			if (!draftId) return null;
			const draftRow = await db.table<LocalDraft>('writingDrafts').get(draftId);
			if (!draftRow || draftRow.deletedAt || !draftRow.currentVersionId) return null;
			const versionRow = await db
				.table<LocalDraftVersion>('writingDraftVersions')
				.get(draftRow.currentVersionId);
			if (!versionRow || versionRow.deletedAt) return null;
			const [decrypted] = await decryptRecords('writingDraftVersions', [versionRow]);
			return decrypted ? toDraftVersion(decrypted) : null;
		},
		null as DraftVersion | null
	);
}

export function useGenerationsForDraft(draftId: string) {
	return useScopedLiveQuery(async () => {
		if (!draftId) return [] as Generation[];
		const rows = await db
			.table<LocalGeneration>('writingGenerations')
			.where('draftId')
			.equals(draftId)
			.toArray();
		const visible = rows.filter((g) => !g.deletedAt);
		const decrypted = await decryptRecords('writingGenerations', visible);
		return decrypted.map(toGeneration).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [] as Generation[]);
}

export function useAllStyles() {
	return useScopedLiveQuery(async () => {
		const rows = await scopedForModule<LocalWritingStyle, string>(
			'writing',
			'writingStyles'
		).toArray();
		const visible = rows.filter((s) => !s.deletedAt);
		const decrypted = await decryptRecords('writingStyles', visible);
		return decrypted.map(toWritingStyle);
	}, [] as WritingStyle[]);
}

// ─── Pure Helpers ─────────────────────────────────────────

export function filterByKind(drafts: Draft[], kind: DraftKind): Draft[] {
	return drafts.filter((d) => d.kind === kind);
}

export function filterByStatus(drafts: Draft[], status: DraftStatus): Draft[] {
	return drafts.filter((d) => d.status === status);
}

export function searchDrafts(drafts: Draft[], query: string): Draft[] {
	const lower = query.toLowerCase();
	return drafts.filter(
		(d) => d.title.toLowerCase().includes(lower) || d.briefing.topic.toLowerCase().includes(lower)
	);
}

export function sortByUpdated(drafts: Draft[]): Draft[] {
	return [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function groupByKind(drafts: Draft[]): Record<DraftKind, Draft[]> {
	const out: Record<DraftKind, Draft[]> = {
		blog: [],
		essay: [],
		email: [],
		social: [],
		story: [],
		letter: [],
		speech: [],
		'cover-letter': [],
		'product-description': [],
		'press-release': [],
		bio: [],
		other: [],
	};
	for (const d of drafts) out[d.kind].push(d);
	return out;
}

export interface WritingStats {
	totalDrafts: number;
	byStatus: Record<DraftStatus, number>;
	totalWords: number;
	currentlyActive: number;
}

export function computeStats(drafts: Draft[], versions: DraftVersion[]): WritingStats {
	const byStatus: Record<DraftStatus, number> = {
		draft: 0,
		refining: 0,
		complete: 0,
		published: 0,
	};
	let currentlyActive = 0;
	for (const d of drafts) {
		byStatus[d.status]++;
		if (d.status === 'draft' || d.status === 'refining') currentlyActive++;
	}
	const totalWords = versions.reduce((acc, v) => acc + v.wordCount, 0);
	return {
		totalDrafts: drafts.length,
		byStatus,
		totalWords,
		currentlyActive,
	};
}
