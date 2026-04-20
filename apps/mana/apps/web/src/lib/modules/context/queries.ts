/**
 * Reactive Queries & Pure Helpers for Context module.
 *
 * Uses Dexie liveQuery to automatically re-render when IndexedDB changes
 * (local writes, sync updates, other tabs). Components call these hooks
 * at init time; no manual fetch/refresh needed.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '$lib/data/database';
import { scopedForModule } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import type { LocalContextSpace, LocalDocument, Space, Document, DocumentType } from './types';

// ─── Type Converters ──────────────────────────────────────

/** Convert LocalContextSpace (IndexedDB) to shared Space type. */
export function toSpace(local: LocalContextSpace): Space {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? null,
		user_id: 'local',
		created_at: local.createdAt ?? new Date().toISOString(),
		settings: local.settings ?? null,
		pinned: local.pinned,
		prefix: local.prefix,
	};
}

/** Convert LocalDocument (IndexedDB) to shared Document type. */
export function toDocument(local: LocalDocument): Document {
	return {
		id: local.id,
		title: local.title,
		content: local.content,
		type: local.type,
		space_id: local.contextSpaceId ?? null,
		user_id: 'local',
		created_at: local.createdAt ?? new Date().toISOString(),
		updated_at: local.updatedAt ?? new Date().toISOString(),
		metadata: local.metadata ?? null,
		short_id: local.shortId ?? undefined,
		pinned: local.pinned,
	};
}

// ─── Live Query Hooks (call during component init) ────────

/** All spaces, sorted by name. Auto-updates on any change. */
export function useAllSpaces() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalContextSpace, string>(
			'context',
			'contextSpaces'
		).toArray();
		return locals
			.filter((s) => !s.deletedAt)
			.map(toSpace)
			.sort((a, b) => a.name.localeCompare(b.name));
	}, [] as Space[]);
}

/** All documents, sorted by updated_at desc. Auto-updates on any change. */
export function useAllDocuments() {
	return useLiveQueryWithDefault(async () => {
		const locals = await scopedForModule<LocalDocument, string>('context', 'documents').toArray();
		const visible = locals.filter((d) => !d.deletedAt);
		const decrypted = await decryptRecords('documents', visible);
		return decrypted
			.map(toDocument)
			.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
	}, [] as Document[]);
}

/** Documents for a specific context-space. Auto-updates on any change. */
export function useSpaceDocuments(contextSpaceId: string) {
	return useLiveQueryWithDefault(async () => {
		const locals = await db
			.table<LocalDocument>('documents')
			.where('contextSpaceId')
			.equals(contextSpaceId)
			.toArray();
		const visible = locals.filter((d) => !d.deletedAt);
		const decrypted = await decryptRecords('documents', visible);
		return decrypted
			.map(toDocument)
			.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
	}, [] as Document[]);
}

// ─── Pure Helper Functions (for $derived) ─────────────────

/** Get pinned spaces from a list. */
export function getPinnedSpaces(spaces: Space[]): Space[] {
	return spaces.filter((s) => s.pinned);
}

/** Filter documents by type, search query, and tags. */
export function filterDocuments(
	documents: Document[],
	options: {
		typeFilter?: DocumentType | 'all';
		searchQuery?: string;
		tagFilter?: string[];
	}
): Document[] {
	let filtered = documents;

	if (options.typeFilter && options.typeFilter !== 'all') {
		filtered = filtered.filter((d) => d.type === options.typeFilter);
	}

	if (options.searchQuery?.trim()) {
		const q = options.searchQuery.toLowerCase();
		filtered = filtered.filter(
			(d) => d.title.toLowerCase().includes(q) || d.content?.toLowerCase().includes(q)
		);
	}

	if (options.tagFilter && options.tagFilter.length > 0) {
		filtered = filtered.filter((d) =>
			options.tagFilter!.some((tag) => d.metadata?.tags?.includes(tag))
		);
	}

	return filtered;
}

/** Compute document stats from a list. */
export function getDocumentStats(documents: Document[]) {
	return {
		total: documents.length,
		text: documents.filter((d) => d.type === 'text').length,
		context: documents.filter((d) => d.type === 'context').length,
		prompt: documents.filter((d) => d.type === 'prompt').length,
		totalWords: documents.reduce((sum, d) => sum + (d.metadata?.word_count || 0), 0),
	};
}

/** Get all unique tags from documents. */
export function getAllDocumentTags(documents: Document[]): string[] {
	const tags = new Set<string>();
	documents.forEach((d) => {
		d.metadata?.tags?.forEach((t) => tags.add(t));
	});
	return Array.from(tags).sort();
}

/** Find a space by ID. */
export function findSpaceById(spaces: Space[], id: string): Space | undefined {
	return spaces.find((s) => s.id === id);
}

/** Find a document by ID. */
export function findDocumentById(documents: Document[], id: string): Document | undefined {
	return documents.find((d) => d.id === id);
}
