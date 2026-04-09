/**
 * Ingest loop — for each source, fetch the feed, normalize, dedupe by
 * url-hash, optionally fall back to Readability for full text, and
 * insert into `news.curated_articles`.
 *
 * Designed to be safe under repeated runs:
 * - duplicate urls are caught by the unique index on `url_hash` and
 *   silently skipped via `ON CONFLICT DO NOTHING`.
 * - one bad source must not poison the whole tick: every source is
 *   wrapped in its own try/catch.
 *
 * Retention: anything older than RETENTION_DAYS is pruned at the end of
 * each tick. Saved articles already live in users' encrypted IndexedDB
 * by then, so the pool is purely a discovery surface.
 */

import { createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { Database } from './db/connection';
import { curatedArticles, type NewCuratedArticle } from './db/schema';
import { SOURCES, type NewsSource } from './sources';
import { fetchFeed, type NormalizedFeedItem } from './parsers/rss';
import { fetchHackerNews } from './parsers/hn';
import { fetchAndExtract } from './parsers/readability';

const RETENTION_DAYS = 30;

/** Min word count to consider an RSS body "full enough" to skip Readability. */
const FULL_TEXT_THRESHOLD_WORDS = 200;

function hashUrl(url: string): string {
	return createHash('sha256').update(url).digest('hex');
}

function wordCountOf(text: string | null | undefined): number {
	if (!text) return 0;
	return text.split(/\s+/).filter(Boolean).length;
}

function readingMinutes(words: number): number {
	return Math.max(1, Math.ceil(words / 200));
}

async function fetchSourceItems(source: NewsSource): Promise<NormalizedFeedItem[]> {
	if (source.type === 'hn') return fetchHackerNews(source.url);
	return fetchFeed(source.url);
}

/**
 * Convert a normalized feed item into a `NewCuratedArticle` row,
 * optionally enriching with Readability if the feed body is too thin.
 */
async function buildRow(
	item: NormalizedFeedItem,
	source: NewsSource
): Promise<NewCuratedArticle | null> {
	if (!item.url || !item.title) return null;

	let content = item.content;
	let htmlContent = item.htmlContent;
	let excerpt = item.excerpt;
	let author = item.author;
	let imageUrl = item.imageUrl;

	const initialWords = wordCountOf(content);
	if (initialWords < FULL_TEXT_THRESHOLD_WORDS) {
		const extracted = await fetchAndExtract(item.url);
		if (extracted) {
			content = extracted.content;
			htmlContent = extracted.htmlContent || htmlContent;
			excerpt = excerpt || extracted.excerpt;
			author = author || extracted.byline;
			// imageUrl from RSS wins; Readability rarely has a good one.
			imageUrl = imageUrl ?? null;
		}
	}

	const words = wordCountOf(content);
	if (words === 0) return null; // nothing usable, skip

	return {
		urlHash: hashUrl(item.url),
		originalUrl: item.url,
		title: item.title,
		excerpt: excerpt ?? null,
		content,
		htmlContent: htmlContent ?? null,
		author: author ?? null,
		siteName: source.name,
		sourceSlug: source.slug,
		imageUrl,
		topic: source.topic,
		language: source.language,
		wordCount: words,
		readingTimeMinutes: readingMinutes(words),
		publishedAt: item.publishedAt ?? new Date(),
	};
}

interface SourceResult {
	slug: string;
	fetched: number;
	inserted: number;
	error?: string;
}

async function ingestSource(db: Database, source: NewsSource): Promise<SourceResult> {
	const result: SourceResult = { slug: source.slug, fetched: 0, inserted: 0 };

	let items: NormalizedFeedItem[];
	try {
		items = await fetchSourceItems(source);
	} catch (err) {
		result.error = err instanceof Error ? err.message : String(err);
		return result;
	}
	result.fetched = items.length;

	for (const item of items) {
		try {
			const row = await buildRow(item, source);
			if (!row) continue;
			const inserted = await db
				.insert(curatedArticles)
				.values(row)
				.onConflictDoNothing({ target: curatedArticles.urlHash })
				.returning({ id: curatedArticles.id });
			if (inserted.length > 0) result.inserted += 1;
		} catch (err) {
			console.warn(
				`[ingest] ${source.slug}: failed to insert "${item.title?.slice(0, 60) ?? '?'}":`,
				err instanceof Error ? err.message : err
			);
		}
	}

	return result;
}

export interface TickResult {
	startedAt: string;
	durationMs: number;
	sources: SourceResult[];
	totalInserted: number;
	pruned: number;
}

export async function runIngestTick(db: Database): Promise<TickResult> {
	const start = Date.now();
	const startedAt = new Date(start).toISOString();

	const sources: SourceResult[] = [];
	for (const source of SOURCES) {
		const r = await ingestSource(db, source);
		sources.push(r);
		if (r.error) {
			console.warn(`[ingest] ${r.slug}: ${r.error}`);
		} else {
			console.log(
				`[ingest] ${r.slug}: ${r.inserted}/${r.fetched} new (topic=${SOURCES.find((s) => s.slug === r.slug)?.topic})`
			);
		}
	}

	// Retention sweep
	const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
	const pruneRes = await db.execute(
		sql`DELETE FROM news.curated_articles WHERE ingested_at < ${cutoff.toISOString()}`
	);
	// drizzle's postgres-js execute returns a result with `count` on most queries.
	const pruned = (pruneRes as unknown as { count?: number }).count ?? 0;

	const totalInserted = sources.reduce((acc, s) => acc + s.inserted, 0);
	const durationMs = Date.now() - start;

	console.log(`[ingest] tick complete: +${totalInserted} new, -${pruned} pruned, ${durationMs}ms`);

	return { startedAt, durationMs, sources, totalInserted, pruned };
}
