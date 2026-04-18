/**
 * Discovery types — shared between API client, queries, and UI components.
 */

export interface DiscoveryRegion {
	id: string;
	label: string;
	lat: number;
	lon: number;
	radiusKm: number;
	isActive: boolean;
	createdAt: string;
}

export interface DiscoveryInterest {
	id: string;
	category: string;
	freetext: string | null;
	weight: number;
	createdAt: string;
}

export interface DiscoverySource {
	id: string;
	type: 'ical' | 'website';
	url: string | null;
	name: string;
	regionId: string | null;
	crawlIntervalHours: number;
	lastCrawledAt: string | null;
	lastSuccessAt: string | null;
	errorCount: number;
	lastError: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DiscoveredEvent {
	id: string;
	title: string;
	description: string | null;
	location: string | null;
	lat: number | null;
	lon: number | null;
	startAt: string;
	endAt: string | null;
	allDay: boolean;
	imageUrl: string | null;
	sourceUrl: string;
	sourceName: string | null;
	category: string | null;
	priceInfo: string | null;
	crawledAt: string;
	userAction: 'save' | 'dismiss' | null;
}

export const EVENT_CATEGORIES = [
	{ id: 'music', label: 'Musik' },
	{ id: 'theater', label: 'Theater' },
	{ id: 'art', label: 'Kunst' },
	{ id: 'tech', label: 'Tech' },
	{ id: 'sport', label: 'Sport' },
	{ id: 'food', label: 'Kulinarik' },
	{ id: 'family', label: 'Familie' },
	{ id: 'nature', label: 'Natur' },
	{ id: 'education', label: 'Bildung' },
	{ id: 'community', label: 'Community' },
	{ id: 'nightlife', label: 'Nachtleben' },
	{ id: 'market', label: 'Markt' },
	{ id: 'other', label: 'Sonstiges' },
] as const;
