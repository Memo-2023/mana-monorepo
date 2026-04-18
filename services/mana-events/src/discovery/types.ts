/**
 * Discovery domain types — shared across parser, scheduler, and routes.
 */

/** A normalized event extracted from any source type. */
export interface NormalizedEvent {
	title: string;
	description?: string | null;
	location?: string | null;
	lat?: number | null;
	lon?: number | null;
	startAt: Date;
	endAt?: Date | null;
	allDay?: boolean;
	imageUrl?: string | null;
	sourceUrl: string;
	category?: string | null;
	priceInfo?: string | null;
	externalId?: string | null;
}

/** Result of crawling a single source. */
export interface CrawlResult {
	sourceId: string;
	sourceName: string;
	events: NormalizedEvent[];
	error?: string;
}

/** Source types supported by the crawler. */
export type SourceType = 'ical' | 'website' | 'api' | 'search_query';

/** Event categories for filtering and scoring. */
export const EVENT_CATEGORIES = [
	'music',
	'theater',
	'art',
	'tech',
	'sport',
	'food',
	'family',
	'nature',
	'education',
	'community',
	'nightlife',
	'market',
	'other',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
