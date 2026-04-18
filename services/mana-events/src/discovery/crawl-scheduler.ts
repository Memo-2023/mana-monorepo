/**
 * Crawl scheduler — periodically processes due discovery sources.
 *
 * Runs on a configurable interval (default 15 min). For each source
 * whose crawl interval has elapsed:
 *   1. Fetch + parse (iCal for now, website extraction in Phase 2)
 *   2. Deduplicate via hash
 *   3. Upsert into discovered_events
 *   4. Update source status (last_crawled_at, error_count)
 *
 * Also cleans up expired events (past events older than 1 day).
 */

import { and, eq, lt, or, isNull, sql } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { discoverySources, discoveredEvents } from '../db/schema/discovery';
import { parseIcalFeed } from './ical-parser';
import { extractEventsFromWebsite } from './website-extractor';
import { computeDedupeHash } from './deduplicator';
import type { NormalizedEvent } from './types';

const MAX_ERROR_COUNT = 5;

/** Find all sources due for a crawl. */
async function getDueSources(db: Database) {
	return db
		.select()
		.from(discoverySources)
		.where(
			and(
				eq(discoverySources.isActive, true),
				or(
					isNull(discoverySources.lastCrawledAt),
					sql`${discoverySources.lastCrawledAt} < now() - (${discoverySources.crawlIntervalHours} || ' hours')::interval`
				)
			)
		);
}

/** External service URLs for Phase 2 website extraction. */
interface CrawlConfig {
	manaResearchUrl: string;
	manaLlmUrl: string;
}

/** Crawl a single source and return normalized events. */
async function crawlSource(
	source: typeof discoverySources.$inferSelect,
	config?: CrawlConfig
): Promise<{ events: NormalizedEvent[]; error?: string }> {
	try {
		switch (source.type) {
			case 'ical': {
				if (!source.url) return { events: [], error: 'No URL configured' };
				const events = await parseIcalFeed(source.url, source.name);
				return { events };
			}
			case 'website': {
				if (!source.url) return { events: [], error: 'No URL configured' };
				if (!config)
					return { events: [], error: 'Missing research/LLM config for website extraction' };
				const events = await extractEventsFromWebsite(
					source.url,
					source.name,
					config.manaResearchUrl,
					config.manaLlmUrl
				);
				return { events };
			}
			default:
				return { events: [], error: `Unsupported source type: ${source.type}` };
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		return { events: [], error: message };
	}
}

/** Upsert normalized events into discovered_events. */
async function upsertEvents(
	db: Database,
	sourceId: string,
	sourceName: string,
	events: NormalizedEvent[]
): Promise<number> {
	let upserted = 0;
	for (const event of events) {
		const dedupeHash = await computeDedupeHash(event);
		const expiresAt = new Date(event.startAt.getTime() + 24 * 60 * 60 * 1000);

		try {
			await db
				.insert(discoveredEvents)
				.values({
					sourceId,
					externalId: event.externalId ?? null,
					dedupeHash,
					title: event.title,
					description: event.description ?? null,
					location: event.location ?? null,
					lat: event.lat ?? null,
					lon: event.lon ?? null,
					startAt: event.startAt,
					endAt: event.endAt ?? null,
					allDay: event.allDay ?? false,
					imageUrl: event.imageUrl ?? null,
					sourceUrl: event.sourceUrl,
					sourceName,
					category: event.category ?? null,
					priceInfo: event.priceInfo ?? null,
					expiresAt,
				})
				.onConflictDoUpdate({
					target: discoveredEvents.dedupeHash,
					set: {
						title: event.title,
						description: event.description ?? null,
						location: event.location ?? null,
						startAt: event.startAt,
						endAt: event.endAt ?? null,
						sourceUrl: event.sourceUrl,
						category: event.category ?? null,
						priceInfo: event.priceInfo ?? null,
						crawledAt: new Date(),
					},
				});
			upserted++;
		} catch (err) {
			// Log but don't fail the whole batch for one bad event
			console.error(`[discovery] failed to upsert event "${event.title}":`, err);
		}
	}
	return upserted;
}

/** Process a single source: crawl, dedup, upsert, update status. */
async function processSource(
	db: Database,
	source: typeof discoverySources.$inferSelect,
	config?: CrawlConfig
): Promise<void> {
	const { events, error } = await crawlSource(source, config);
	const now = new Date();

	if (error) {
		const newErrorCount = source.errorCount + 1;
		await db
			.update(discoverySources)
			.set({
				lastCrawledAt: now,
				errorCount: newErrorCount,
				lastError: error,
				isActive: newErrorCount < MAX_ERROR_COUNT,
				updatedAt: now,
			})
			.where(eq(discoverySources.id, source.id));

		if (newErrorCount >= MAX_ERROR_COUNT) {
			console.warn(
				`[discovery] source "${source.name}" (${source.id}) deactivated after ${MAX_ERROR_COUNT} errors`
			);
		}
		return;
	}

	const upserted = await upsertEvents(db, source.id, source.name, events);

	await db
		.update(discoverySources)
		.set({
			lastCrawledAt: now,
			lastSuccessAt: now,
			errorCount: 0,
			lastError: null,
			updatedAt: now,
		})
		.where(eq(discoverySources.id, source.id));

	if (upserted > 0) {
		console.log(`[discovery] crawled "${source.name}" — ${upserted} events upserted`);
	}
}

/** Delete discovered events whose expiry has passed (past events). */
async function cleanupExpiredEvents(db: Database): Promise<number> {
	const result = await db
		.delete(discoveredEvents)
		.where(lt(discoveredEvents.expiresAt, new Date()))
		.returning({ id: discoveredEvents.id });
	return result.length;
}

/** Run one tick of the crawl scheduler. */
export async function runCrawlTick(db: Database, config?: CrawlConfig): Promise<void> {
	try {
		const due = await getDueSources(db);
		for (const source of due) {
			await processSource(db, source, config);
		}

		const expired = await cleanupExpiredEvents(db);
		if (expired > 0) {
			console.log(`[discovery] cleaned up ${expired} expired events`);
		}
	} catch (err) {
		console.error('[discovery] crawl tick failed:', err);
	}
}

/**
 * Start the periodic crawl scheduler. Returns a stop function.
 * Default interval: 15 minutes.
 */
export function startCrawlScheduler(
	db: Database,
	config?: CrawlConfig,
	intervalMs = 15 * 60 * 1000
): () => void {
	const tick = () => runCrawlTick(db, config);

	// First run shortly after boot
	const bootTimer = setTimeout(tick, 10_000);
	const intervalTimer = setInterval(tick, intervalMs);

	return () => {
		clearTimeout(bootTimer);
		clearInterval(intervalTimer);
	};
}

/**
 * Crawl a single source immediately (triggered by user action).
 * Returns the number of events upserted.
 */
export async function crawlSourceNow(
	db: Database,
	sourceId: string,
	config?: CrawlConfig
): Promise<{ upserted: number; error?: string }> {
	const sources = await db
		.select()
		.from(discoverySources)
		.where(eq(discoverySources.id, sourceId))
		.limit(1);

	if (!sources[0]) return { upserted: 0, error: 'Source not found' };

	const source = sources[0];
	const { events, error } = await crawlSource(source, config);
	const now = new Date();

	if (error) {
		await db
			.update(discoverySources)
			.set({
				lastCrawledAt: now,
				errorCount: source.errorCount + 1,
				lastError: error,
				updatedAt: now,
			})
			.where(eq(discoverySources.id, sourceId));
		return { upserted: 0, error };
	}

	const upserted = await upsertEvents(db, sourceId, source.name, events);

	await db
		.update(discoverySources)
		.set({
			lastCrawledAt: now,
			lastSuccessAt: now,
			errorCount: 0,
			lastError: null,
			updatedAt: now,
		})
		.where(eq(discoverySources.id, sourceId));

	return { upserted };
}
