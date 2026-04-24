/**
 * Reference resolver — turns a DraftReference into plaintext content the
 * prompt builder can inject. Each kind has its own fetch path (scoped
 * Dexie read + decryptRecords + module type converter) so we don't drag
 * the per-module store layer into the writing module.
 *
 * M5 scope: `article`, `note`, `library`, `url`. Other kinds
 * (`kontext`, `goal`, `me-image`) fall through to `null` and are
 * silently skipped by the generations store — they are on the roadmap
 * but not required for M5 to be useful.
 *
 * Each resolved reference is truncated to MAX_CHARS_PER_REF so a
 * long-form article can't blow out the token window. MAX_TOTAL_CHARS
 * caps the aggregate across all references; any extras are dropped
 * with a note, not truncated mid-sentence.
 */

import { scopedGet } from '$lib/data/scope';
import { decryptRecords } from '$lib/data/crypto';
import { toArticle } from '$lib/modules/articles/queries';
import { toNote } from '$lib/modules/notes/queries';
import { toLibraryEntry } from '$lib/modules/library/queries';
import type { LocalArticle } from '$lib/modules/articles/types';
import type { LocalNote } from '$lib/modules/notes/types';
import type { LocalLibraryEntry } from '$lib/modules/library/types';
import type { DraftReference } from '../types';

const MAX_CHARS_PER_REF = 1500;
const TRUNCATION_MARKER = '\n[… gekürzt …]';
/** Soft cap — extras past this are dropped rather than partially truncated. */
export const MAX_TOTAL_REFERENCE_CHARS = 8000;

export interface ResolvedReference {
	kind: DraftReference['kind'];
	/** Human-readable source label shown in the prompt (e.g. "Artikel: New York Times — Title"). */
	sourceLabel: string;
	/** Short title fragment used in logs / chips. */
	title: string;
	/** Plaintext body — already truncated. */
	content: string;
	/** Optional user-written note about why this reference matters. */
	note: string | null;
}

function truncate(text: string, max = MAX_CHARS_PER_REF): string {
	const trimmed = text.trim();
	if (trimmed.length <= max) return trimmed;
	return trimmed.slice(0, max) + TRUNCATION_MARKER;
}

async function resolveArticle(
	id: string
): Promise<Omit<ResolvedReference, 'kind' | 'note'> | null> {
	const local = await scopedGet<LocalArticle>('articles', id);
	if (!local || local.deletedAt) return null;
	const [decrypted] = await decryptRecords('articles', [local]);
	if (!decrypted) return null;
	const article = toArticle(decrypted);
	const siteName = article.siteName ? `${article.siteName} — ` : '';
	return {
		sourceLabel: `Artikel: ${siteName}${article.title}`,
		title: article.title,
		content: truncate(article.content ?? article.excerpt ?? ''),
	};
}

async function resolveNote(id: string): Promise<Omit<ResolvedReference, 'kind' | 'note'> | null> {
	const local = await scopedGet<LocalNote>('notes', id);
	if (!local || local.deletedAt) return null;
	const [decrypted] = await decryptRecords('notes', [local]);
	if (!decrypted) return null;
	const note = toNote(decrypted);
	return {
		sourceLabel: `Notiz: ${note.title || 'Ohne Titel'}`,
		title: note.title || 'Notiz',
		content: truncate(note.content ?? ''),
	};
}

async function resolveLibrary(
	id: string
): Promise<Omit<ResolvedReference, 'kind' | 'note'> | null> {
	const local = await scopedGet<LocalLibraryEntry>('libraryEntries', id);
	if (!local || local.deletedAt) return null;
	const [decrypted] = await decryptRecords('libraryEntries', [local]);
	if (!decrypted) return null;
	const entry = toLibraryEntry(decrypted);
	const kindLabel =
		entry.kind === 'book'
			? 'Buch'
			: entry.kind === 'movie'
				? 'Film'
				: entry.kind === 'series'
					? 'Serie'
					: entry.kind === 'comic'
						? 'Comic'
						: entry.kind;
	const parts: string[] = [];
	if (entry.creators.length) parts.push(`von ${entry.creators.join(', ')}`);
	if (entry.year) parts.push(`${entry.year}`);
	if (entry.rating !== null) parts.push(`Rating: ${entry.rating}/5`);
	const meta = parts.length ? ` (${parts.join(', ')})` : '';

	// Use the user's review as the body if present — it's the user's own
	// distilled take; otherwise fall back to the title+metadata line so
	// the reference still tells the model what the user engaged with.
	const body = entry.review ? `Meine Notiz zu diesem ${kindLabel}:\n${entry.review}` : '';
	return {
		sourceLabel: `${kindLabel}: ${entry.title}${meta}`,
		title: entry.title,
		content: truncate(body),
	};
}

function resolveUrl(ref: DraftReference): Omit<ResolvedReference, 'kind' | 'note'> | null {
	if (!ref.url) return null;
	// For M5 we don't fetch the URL — that would need a server proxy
	// (CORS) and a Readability pass. The URL + optional user note is
	// handed straight to the model; the user can save the article via
	// the articles module first for full-content injection. The label
	// mentions "Link" so the model knows it's a pointer, not a body.
	return {
		sourceLabel: `Link: ${ref.url}`,
		title: ref.url,
		content: '',
	};
}

export async function resolveReference(ref: DraftReference): Promise<ResolvedReference | null> {
	switch (ref.kind) {
		case 'article': {
			if (!ref.targetId) return null;
			const base = await resolveArticle(ref.targetId);
			return base ? { ...base, kind: 'article', note: ref.note ?? null } : null;
		}
		case 'note': {
			if (!ref.targetId) return null;
			const base = await resolveNote(ref.targetId);
			return base ? { ...base, kind: 'note', note: ref.note ?? null } : null;
		}
		case 'library': {
			if (!ref.targetId) return null;
			const base = await resolveLibrary(ref.targetId);
			return base ? { ...base, kind: 'library', note: ref.note ?? null } : null;
		}
		case 'url': {
			const base = resolveUrl(ref);
			return base ? { ...base, kind: 'url', note: ref.note ?? null } : null;
		}
		// kontext / goal / me-image — roadmap, not M5.
		default:
			return null;
	}
}

/**
 * Resolve a list of references in parallel, dropping any that can't be
 * loaded (deleted row, missing target, unsupported kind). Enforces the
 * aggregate character budget — further references beyond the cap are
 * dropped so the prompt never silently exceeds the budget.
 */
export async function resolveReferences(
	refs: readonly DraftReference[]
): Promise<ResolvedReference[]> {
	const resolved = (await Promise.all(refs.map((r) => resolveReference(r)))).filter(
		(r): r is ResolvedReference => r !== null
	);
	const out: ResolvedReference[] = [];
	let total = 0;
	for (const ref of resolved) {
		const size = ref.sourceLabel.length + ref.content.length + (ref.note?.length ?? 0);
		if (total + size > MAX_TOTAL_REFERENCE_CHARS && out.length > 0) break;
		out.push(ref);
		total += size;
	}
	return out;
}
