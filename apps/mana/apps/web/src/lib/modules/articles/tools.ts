/**
 * Articles AI Tools — LLM-accessible operations for the articles module.
 *
 * Catalog entries live in `@mana/shared-ai/src/tools/schemas.ts` and drive
 * the policy layer + server planner automatically; this file contributes
 * the execute-side glue.
 *
 *   list_articles           auto    Read-only listing for agent context.
 *   save_article            propose URL → Readability → encrypted save.
 *                                  Legacy `save_news_article` kept as
 *                                  alias in `modules/news/tools.ts`.
 *   archive_article         propose Flips status → 'archived'.
 *   tag_article             propose Creates (or reuses) a global tag by
 *                                  name and links it to the article.
 *   add_article_highlight   propose Persists a highlight anchored to the
 *                                  first verbatim occurrence of `text`
 *                                  in the article's plain content. Fails
 *                                  gracefully if the snippet isn't found.
 */

import { decryptRecords } from '$lib/data/crypto';
import { scopedForModule, scopedGet } from '$lib/data/scope';
import { tagMutations, useAllTags } from '@mana/shared-stores';
import type { ModuleTool } from '$lib/data/tools/types';
import { articlesStore } from './stores/articles.svelte';
import { articleImportsStore, parseUrls } from './stores/imports.svelte';
import { highlightsStore } from './stores/highlights.svelte';
import { articleTagOps } from './stores/tags.svelte';
import { toArticle } from './queries';
import type { HighlightColor, LocalArticle, ArticleStatus } from './types';

const DEFAULT_LIST_LIMIT = 30;
const MAX_LIST_LIMIT = 100;
const MIN_HIGHLIGHT_TEXT = 10;
const MAX_HIGHLIGHT_TEXT = 500;

export const articlesTools: ModuleTool[] = [
	{
		name: 'list_articles',
		module: 'articles',
		description:
			'Listet gespeicherte Artikel (id, title, siteName, status, readingTime). Optional nach Status filtern.',
		parameters: [
			{
				name: 'status',
				type: 'string',
				description:
					'Nur Artikel mit diesem Status. Default: ohne Filter (archivierte werden nur bei "archived"/"all" eingeschlossen).',
				required: false,
				enum: ['unread', 'reading', 'finished', 'archived', 'all'],
			},
			{
				name: 'limit',
				type: 'number',
				description: `Maximale Anzahl (Standard ${DEFAULT_LIST_LIMIT}, max ${MAX_LIST_LIMIT})`,
				required: false,
			},
			{
				name: 'query',
				type: 'string',
				description: 'Case-insensitive Substring-Filter auf Titel / Autor / Quelle',
				required: false,
			},
		],
		async execute(params) {
			const limit = Math.min(
				Math.max(Number(params.limit) || DEFAULT_LIST_LIMIT, 1),
				MAX_LIST_LIMIT
			);
			const statusFilter = typeof params.status === 'string' ? params.status : '';
			const query = typeof params.query === 'string' ? params.query.toLowerCase().trim() : '';

			const locals = await scopedForModule<LocalArticle, string>('articles', 'articles').toArray();
			const visible = locals.filter((a) => {
				if (a.deletedAt) return false;
				if (statusFilter === 'all') return true;
				if (statusFilter === '' || !statusFilter) return a.status !== 'archived';
				return a.status === statusFilter;
			});
			const decrypted = await decryptRecords('articles', visible);

			const matches = query
				? decrypted.filter(
						(a) =>
							a.title.toLowerCase().includes(query) ||
							(a.author?.toLowerCase().includes(query) ?? false) ||
							(a.siteName?.toLowerCase().includes(query) ?? false)
					)
				: decrypted;

			const rows = matches
				.sort((a, b) => (b.savedAt ?? '').localeCompare(a.savedAt ?? ''))
				.slice(0, limit)
				.map((a) => ({
					id: a.id,
					title: a.title,
					siteName: a.siteName,
					status: a.status,
					readingTimeMinutes: a.readingTimeMinutes,
					url: a.originalUrl,
					savedAt: a.savedAt,
				}));

			return {
				success: true,
				message: `${rows.length} Artikel gefunden`,
				data: { articles: rows, total: matches.length },
			};
		},
	},

	{
		name: 'save_article',
		module: 'articles',
		description:
			'Speichert einen Artikel von einer URL in die Leseliste. URL wird serverseitig per Readability extrahiert.',
		parameters: [
			{ name: 'url', type: 'string', description: 'Die Artikel-URL', required: true },
			{
				name: 'title',
				type: 'string',
				description: 'Anzeigetitel für den Approval-Dialog (informativ)',
				required: false,
			},
			{
				name: 'reason',
				type: 'string',
				description: 'Kurze Begründung warum der Artikel für den Nutzer relevant ist',
				required: false,
			},
		],
		async execute(params) {
			const url = String(params.url ?? '').trim();
			if (!url) return { success: false, message: 'URL fehlt' };
			const { article, duplicate } = await articlesStore.saveFromUrl(url);
			return {
				success: true,
				message: duplicate
					? `Artikel bereits gespeichert: ${article.title}`
					: `Artikel gespeichert: ${article.title}`,
				data: { articleId: article.id, title: article.title, duplicate },
			};
		},
	},

	{
		name: 'archive_article',
		module: 'articles',
		description: 'Verschiebt einen Artikel ins Archiv.',
		parameters: [
			{
				name: 'articleId',
				type: 'string',
				description: 'ID des Artikels (aus list_articles)',
				required: true,
			},
		],
		async execute(params) {
			const id = String(params.articleId ?? '').trim();
			if (!id) return { success: false, message: 'articleId fehlt' };
			const existing = await scopedGet<LocalArticle>('articles', id);
			if (!existing || existing.deletedAt) {
				return { success: false, message: `Kein Artikel mit id ${id}` };
			}
			await articlesStore.setStatus(id, 'archived' satisfies ArticleStatus);
			return { success: true, message: 'Artikel archiviert', data: { articleId: id } };
		},
	},

	{
		name: 'tag_article',
		module: 'articles',
		description:
			'Vergibt einen Tag auf einen Artikel. Tag wird angelegt falls er noch nicht existiert.',
		parameters: [
			{
				name: 'articleId',
				type: 'string',
				description: 'ID des Artikels (aus list_articles)',
				required: true,
			},
			{
				name: 'tagName',
				type: 'string',
				description: 'Tag-Name (z.B. "KI", "lesen bald")',
				required: true,
			},
		],
		async execute(params) {
			const id = String(params.articleId ?? '').trim();
			const rawName = String(params.tagName ?? '').trim();
			if (!id) return { success: false, message: 'articleId fehlt' };
			if (!rawName) return { success: false, message: 'tagName fehlt' };
			const name = rawName.slice(0, 60);

			const existing = await scopedGet<LocalArticle>('articles', id);
			if (!existing || existing.deletedAt) {
				return { success: false, message: `Kein Artikel mit id ${id}` };
			}

			// useAllTags().value works even outside a Svelte reactive scope —
			// it returns the current in-memory snapshot. Match by lower-case
			// name so "KI" and "ki" dedupe.
			const pool = useAllTags().value;
			const needle = name.toLowerCase();
			let tag = pool.find((t) => t.name.toLowerCase() === needle);
			if (!tag) {
				tag = await tagMutations.createTag({ name });
			}

			await articleTagOps.addTag(id, tag.id);
			return {
				success: true,
				message: `Tag „${tag.name}" gesetzt`,
				data: {
					articleId: id,
					tagId: tag.id,
					tagName: tag.name,
					created: !pool.some((t) => t.id === tag!.id),
				},
			};
		},
	},

	{
		name: 'add_article_highlight',
		module: 'articles',
		description:
			'Markiert eine Textstelle in einem Artikel als Highlight. Der Text muss wörtlich im Artikel vorkommen.',
		parameters: [
			{
				name: 'articleId',
				type: 'string',
				description: 'ID des Artikels (aus list_articles)',
				required: true,
			},
			{
				name: 'text',
				type: 'string',
				description: 'Wörtliche Textstelle die markiert werden soll (10–500 Zeichen)',
				required: true,
			},
			{
				name: 'color',
				type: 'string',
				description: 'Highlight-Farbe',
				required: false,
				enum: ['yellow', 'green', 'blue', 'pink'],
			},
			{
				name: 'note',
				type: 'string',
				description: 'Optionale Notiz zum Highlight',
				required: false,
			},
		],
		async execute(params) {
			const id = String(params.articleId ?? '').trim();
			const text = String(params.text ?? '').trim();
			const color = (params.color as HighlightColor | undefined) ?? 'yellow';
			const note = typeof params.note === 'string' ? params.note.trim() || null : null;

			if (!id) return { success: false, message: 'articleId fehlt' };
			if (text.length < MIN_HIGHLIGHT_TEXT) {
				return { success: false, message: `Text zu kurz (min ${MIN_HIGHLIGHT_TEXT} Zeichen)` };
			}
			if (text.length > MAX_HIGHLIGHT_TEXT) {
				return { success: false, message: `Text zu lang (max ${MAX_HIGHLIGHT_TEXT} Zeichen)` };
			}

			const existing = await scopedGet<LocalArticle>('articles', id);
			if (!existing || existing.deletedAt) {
				return { success: false, message: `Kein Artikel mit id ${id}` };
			}
			const [decrypted] = await decryptRecords('articles', [existing]);
			if (!decrypted) return { success: false, message: 'Entschlüsselung fehlgeschlagen' };
			const article = toArticle(decrypted);

			// Snap to the first verbatim occurrence of the snippet in the
			// Readability-extracted plain content. If the AI is hallucinating
			// (or the article was re-extracted and the text shifted) we bail
			// instead of persisting an orphan highlight.
			const startOffset = article.content.indexOf(text);
			if (startOffset < 0) {
				return { success: false, message: 'Textstelle nicht im Artikel gefunden' };
			}
			const endOffset = startOffset + text.length;
			const contextBefore =
				article.content.slice(Math.max(0, startOffset - 40), startOffset) || null;
			const contextAfter = article.content.slice(endOffset, endOffset + 40) || null;

			const highlight = await highlightsStore.addHighlight({
				articleId: id,
				text,
				color,
				note,
				startOffset,
				endOffset,
				contextBefore,
				contextAfter,
			});
			return {
				success: true,
				message: 'Highlight gesetzt',
				data: { highlightId: highlight.id, articleId: id },
			};
		},
	},

	// ─── Bulk-Import (docs/plans/articles-bulk-import.md) ───
	{
		name: 'import_articles_from_urls',
		module: 'articles',
		description:
			'Erstellt einen Bulk-Import-Job für mehrere URLs. Server extrahiert sie nacheinander im Hintergrund. Auto-policy: kein Approval pro Artikel, der Job ist ein einziger Task.',
		parameters: [
			{
				name: 'urls',
				type: 'array',
				description: 'Liste der Artikel-URLs (max 50)',
				required: true,
			},
		],
		execute: async (params: Record<string, unknown>) => {
			const rawUrls = params.urls;
			if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
				return { success: false, message: 'urls muss ein nicht-leeres Array sein' };
			}
			if (rawUrls.length > 50) {
				return {
					success: false,
					message: 'Maximal 50 URLs pro Job. Splitte in mehrere Aufrufe.',
				};
			}
			const blob = rawUrls.filter((u): u is string => typeof u === 'string').join('\n');
			const parsed = parseUrls(blob);
			if (parsed.valid.length === 0) {
				return {
					success: false,
					message: `Keine gültigen URLs (alle ${rawUrls.length} verworfen)`,
				};
			}
			const jobId = await articleImportsStore.createJob(parsed.valid);
			return {
				success: true,
				message: `Bulk-Import gestartet (${parsed.valid.length} URLs${parsed.duplicates.length ? `, ${parsed.duplicates.length} Duplikate übersprungen` : ''}${parsed.invalid.length ? `, ${parsed.invalid.length} ungültig` : ''})`,
				data: {
					jobId,
					accepted: parsed.valid.length,
					duplicates: parsed.duplicates.length,
					invalid: parsed.invalid.length,
				},
			};
		},
	},
];
