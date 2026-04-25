/**
 * Reactive queries & pure helpers for Memoro — uses Dexie liveQuery on the unified DB.
 */

import { useScopedLiveQuery } from '$lib/data/scope/use-scoped-live-query.svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
// `useAllTags` re-exports the shared-tags hook below; the actual tag
// objects flowing through this module are the shared shape, not the
// memoro/types.Tag declared next to LocalMemoTag. Importing the shared
// type here keeps `getTagsForMemo` and friends in sync with what the
// hook actually returns.
import type { Tag } from '@mana/shared-tags';
import type {
	LocalMemo,
	LocalMemory,
	LocalMemoTag,
	LocalSpace,
	Memo,
	Memory,
	Space,
} from './types';

// ─── Type Converters ───────────────────────────────────────

export function toMemo(local: LocalMemo): Memo {
	return {
		id: local.id,
		title: local.title,
		intro: local.intro,
		transcript: local.transcript,
		audioDurationMs: local.audioDurationMs,
		transcriptModel: local.transcriptModel ?? null,
		processingStatus: local.processingStatus,
		isArchived: local.isArchived,
		isPinned: local.isPinned,
		visibility: local.visibility ?? 'space',
		language: local.language,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toMemory(local: LocalMemory): Memory {
	return {
		id: local.id,
		memoId: local.memoId,
		title: local.title,
		content: local.content,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export function toSpace(local: LocalSpace): Space {
	return {
		id: local.id,
		name: local.name,
		description: local.description,
		ownerId: local.ownerId,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

// ─── Live Queries ──────────────────────────────────────────

/** All non-archived memos, sorted by pinned first then createdAt desc. */
export function useAllMemos() {
	return useScopedLiveQuery(async () => {
		const visible = (await scopedForModule<LocalMemo, string>('memoro', 'memos').toArray()).filter(
			(m) => !m.deletedAt && !m.isArchived
		);
		const decrypted = await decryptRecords('memos', visible);
		return sortMemos(decrypted.map(toMemo));
	}, [] as Memo[]);
}

/** All archived memos, sorted by updatedAt desc. */
export function useArchivedMemos() {
	return useScopedLiveQuery(async () => {
		const visible = (await scopedForModule<LocalMemo, string>('memoro', 'memos').toArray()).filter(
			(m) => !m.deletedAt && m.isArchived
		);
		const decrypted = await decryptRecords('memos', visible);
		return decrypted
			.map(toMemo)
			.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
	}, [] as Memo[]);
}

/** Memories for a specific memo. */
export function useMemoriesByMemo(memoId: string) {
	return useScopedLiveQuery(async () => {
		const visible = (
			await db.table<LocalMemory>('memories').where('memoId').equals(memoId).toArray()
		).filter((m) => !m.deletedAt);
		const decrypted = await decryptRecords('memories', visible);
		return decrypted.map(toMemory);
	}, [] as Memory[]);
}

// Tags: use shared global tags from @mana/shared-stores
export { useAllTags } from '@mana/shared-stores';

/** All memo-tag associations. */
export function useAllMemoTags() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalMemoTag, string>('memoro', 'memoTags').toArray();
		return locals.filter((mt) => !mt.deletedAt);
	}, [] as LocalMemoTag[]);
}

/** All spaces. */
export function useAllSpaces() {
	return useScopedLiveQuery(async () => {
		const locals = await scopedForModule<LocalSpace, string>('memoro', 'memoroSpaces').toArray();
		return locals.filter((s) => !s.deletedAt).map(toSpace);
	}, [] as Space[]);
}

// ─── Pure Sort / Filter Functions ──────────────────────────

/** Sort memos: pinned first, then by createdAt descending. */
export function sortMemos(list: Memo[]): Memo[] {
	return [...list].sort((a, b) => {
		if (a.isPinned && !b.isPinned) return -1;
		if (!a.isPinned && b.isPinned) return 1;
		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});
}

/** Filter memos by search query on title and transcript. */
export function filterBySearch(memos: Memo[], query: string): Memo[] {
	if (!query.trim()) return memos;
	const lower = query.toLowerCase();
	return memos.filter(
		(m) => m.title?.toLowerCase().includes(lower) || m.transcript?.toLowerCase().includes(lower)
	);
}

/** Filter memos by tag. */
export function filterByTag(memos: Memo[], memoTags: LocalMemoTag[], tagId: string): Memo[] {
	const memoIds = new Set(memoTags.filter((mt) => mt.tagId === tagId).map((mt) => mt.memoId));
	return memos.filter((m) => memoIds.has(m.id));
}

/** Get tags for a specific memo. */
export function getTagsForMemo(tags: Tag[], memoTags: LocalMemoTag[], memoId: string): Tag[] {
	const tagIds = new Set(memoTags.filter((mt) => mt.memoId === memoId).map((mt) => mt.tagId));
	return tags.filter((t) => tagIds.has(t.id));
}

/** Format audio duration in ms to readable string. */
export function formatDuration(ms: number | null): string {
	if (!ms) return '';
	const totalSeconds = Math.floor(ms / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Get processing status label. */
export function getStatusLabel(status: string): string {
	switch (status) {
		case 'pending':
			return 'Ausstehend';
		case 'processing':
			return 'Verarbeitung...';
		case 'completed':
			return 'Fertig';
		case 'failed':
			return 'Fehlgeschlagen';
		default:
			return status;
	}
}
