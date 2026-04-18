/**
 * Source Discoverer — automatically finds event sources for a region.
 *
 * Given a region (e.g. "Freiburg"), searches the web via mana-research
 * for iCal feeds and venue websites, then inserts them as suggested
 * sources the user can activate or reject.
 *
 * Pipeline:
 *   1. Build search queries from region label
 *   2. Search via mana-research POST /api/v1/search
 *   3. Classify results: .ics URLs → 'ical', venue/event pages → 'website'
 *   4. Insert as discovery_sources with is_active=false (suggested)
 */

import { eq, and } from 'drizzle-orm';
import type { Database } from '../db/connection';
import { discoverySources, discoveryRegions } from '../db/schema/discovery';

const SEARCH_TIMEOUT_MS = 15_000;

/** Patterns that indicate an iCal feed URL. */
const ICAL_PATTERNS = [/\.ics$/i, /\.ical$/i, /webcal:\/\//i, /format=ical/i, /export.*ical/i];

/** Patterns that indicate an event/venue page worth crawling. */
const EVENT_PAGE_PATTERNS = [
	/veranstaltung/i,
	/kalender/i,
	/programm/i,
	/events?\b/i,
	/termine/i,
	/konzert/i,
	/festival/i,
	/theater/i,
	/what.?s.?on/i,
	/schedule/i,
	/agenda/i,
];

/** Search queries to discover event sources for a region. */
function buildSearchQueries(regionLabel: string): string[] {
	return [
		`${regionLabel} Veranstaltungskalender`,
		`${regionLabel} Events Termine`,
		`${regionLabel} Kulturzentrum Programm`,
		`${regionLabel} Konzerte Theater Termine`,
		`${regionLabel} Vereine Veranstaltungen`,
	];
}

interface SearchHit {
	url: string;
	title: string;
	snippet?: string;
}

interface SearchResponse {
	success: boolean;
	data?: {
		results: SearchHit[];
	};
}

/** Classify a URL as ical, website, or null (not relevant). */
function classifyUrl(url: string, title: string, snippet?: string): 'ical' | 'website' | null {
	// Check for iCal feed
	if (ICAL_PATTERNS.some((p) => p.test(url))) return 'ical';

	// Check for event/venue page
	const text = `${url} ${title} ${snippet ?? ''}`;
	if (EVENT_PAGE_PATTERNS.some((p) => p.test(text))) return 'website';

	return null;
}

/** Extract a human-readable name from a URL + title. */
function extractSourceName(url: string, title: string): string {
	// Prefer the page title, trimmed to something reasonable
	if (title) {
		// Strip common suffixes
		const cleaned = title
			.replace(/\s*[-|–—]\s*(Startseite|Home|Events?|Veranstaltungen|Termine|Programm).*$/i, '')
			.trim();
		if (cleaned.length > 3 && cleaned.length < 100) return cleaned;
	}
	// Fallback: hostname
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url.slice(0, 80);
	}
}

export interface DiscoverResult {
	suggestedCount: number;
	queries: number;
	searchResults: number;
}

/**
 * Discover event sources for a region by searching the web.
 *
 * Inserts found sources with is_active=false so the user can review
 * and activate them. Skips URLs that already exist as sources.
 */
export async function discoverSourcesForRegion(
	db: Database,
	regionId: string,
	userId: string,
	manaResearchUrl: string
): Promise<DiscoverResult> {
	// Get the region
	const [region] = await db
		.select()
		.from(discoveryRegions)
		.where(and(eq(discoveryRegions.id, regionId), eq(discoveryRegions.userId, userId)))
		.limit(1);

	if (!region) throw new Error('Region not found');

	// Get existing source URLs to avoid duplicates
	const existingSources = await db
		.select({ url: discoverySources.url })
		.from(discoverySources)
		.where(eq(discoverySources.userId, userId));
	const existingUrls = new Set(existingSources.map((s) => s.url).filter(Boolean));

	const queries = buildSearchQueries(region.label);
	let totalResults = 0;
	let suggestedCount = 0;

	// Run searches in parallel (but limit to avoid hammering the service)
	const searchResults = await Promise.all(
		queries.map((query) => searchWeb(manaResearchUrl, query))
	);

	for (const result of searchResults) {
		if (!result?.data?.results) continue;

		for (const hit of result.data.results) {
			totalResults++;
			if (existingUrls.has(hit.url)) continue;

			const type = classifyUrl(hit.url, hit.title, hit.snippet);
			if (!type) continue;

			const name = extractSourceName(hit.url, hit.title);

			try {
				await db.insert(discoverySources).values({
					userId,
					type,
					url: hit.url,
					name,
					regionId,
					isActive: false, // suggested — user must activate
					crawlIntervalHours: type === 'ical' ? 24 : 48,
				});
				existingUrls.add(hit.url);
				suggestedCount++;
			} catch {
				// Ignore dupes from parallel queries
			}
		}
	}

	return { suggestedCount, queries: queries.length, searchResults: totalResults };
}

/** Search the web via mana-research. Gracefully returns null on failure. */
async function searchWeb(manaResearchUrl: string, query: string): Promise<SearchResponse | null> {
	try {
		const res = await fetch(`${manaResearchUrl}/api/v1/search`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query }),
			signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
		});
		if (!res.ok) {
			console.warn(`[source-discoverer] search failed ${res.status}: ${query}`);
			return null;
		}
		return (await res.json()) as SearchResponse;
	} catch (err) {
		console.warn(`[source-discoverer] search error for "${query}":`, err);
		return null;
	}
}
