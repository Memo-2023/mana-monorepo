/**
 * Eventbrite provider — fetches events from the Eventbrite API.
 *
 * Uses the public Event Search API v3 which requires an API token
 * but is free for read operations.
 *
 * API docs: https://www.eventbrite.com/platform/api#/reference/event-search
 *
 * When no API key is configured, this provider is a no-op (returns empty).
 */

import type { EventProvider, ProviderContext, ProviderResult } from './base';
import type { NormalizedEvent } from '../types';

const API_BASE = 'https://www.eventbriteapi.com/v3';
const FETCH_TIMEOUT_MS = 15_000;

/** Eventbrite category ID → our category mapping. */
const CATEGORY_MAP: Record<string, string> = {
	'103': 'music',
	'105': 'art',
	'101': 'tech',
	'108': 'sport',
	'110': 'food',
	'115': 'family',
	'113': 'community',
	'109': 'nature',
	'104': 'art', // film & media
	'107': 'education', // health
	'102': 'tech', // science
	'106': 'nightlife', // fashion
	'111': 'community', // charity
	'112': 'community', // government
	'114': 'other', // spirituality
	'116': 'other', // seasonal
	'117': 'education', // home & lifestyle
	'199': 'other',
};

interface EventbriteEvent {
	id: string;
	name: { text: string; html?: string };
	description: { text: string; html?: string } | null;
	url: string;
	start: { utc: string; local: string; timezone: string };
	end: { utc: string; local: string; timezone: string } | null;
	venue?: {
		name: string;
		address: {
			localized_address_display: string;
			latitude: string;
			longitude: string;
		};
	} | null;
	logo?: { url: string } | null;
	category_id: string | null;
	is_free: boolean;
	ticket_availability?: {
		minimum_ticket_price?: { display: string };
		maximum_ticket_price?: { display: string };
	};
}

interface EventbriteResponse {
	events: EventbriteEvent[];
	pagination: { page_count: number; page_number: number };
}

function getApiKey(): string | null {
	return process.env.EVENTBRITE_API_KEY || null;
}

export const eventbriteProvider: EventProvider = {
	type: 'eventbrite',

	async fetchEvents(_url: string, _name: string, ctx?: ProviderContext): Promise<ProviderResult> {
		const apiKey = getApiKey();
		if (!apiKey) {
			return { events: [], error: 'EVENTBRITE_API_KEY not configured' };
		}

		if (!ctx?.lat || !ctx?.lon) {
			return { events: [], error: 'Region coordinates required for Eventbrite search' };
		}

		try {
			const params = new URLSearchParams({
				'location.latitude': String(ctx.lat),
				'location.longitude': String(ctx.lon),
				'location.within': `${ctx.radiusKm ?? 25}km`,
				'start_date.range_start': new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
				sort_by: 'date',
				expand: 'venue,ticket_availability',
			});

			// Add keyword search if region label available
			if (ctx.regionLabel) {
				params.set('q', ctx.regionLabel);
			}

			const res = await fetch(`${API_BASE}/events/search/?${params}`, {
				headers: { Authorization: `Bearer ${apiKey}` },
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				return { events: [], error: `Eventbrite API ${res.status}: ${body.slice(0, 200)}` };
			}

			const data = (await res.json()) as EventbriteResponse;
			const events = data.events.map(toNormalizedEvent).filter(Boolean) as NormalizedEvent[];
			return { events };
		} catch (err) {
			return {
				events: [],
				error: err instanceof Error ? err.message : 'Eventbrite fetch failed',
			};
		}
	},
};

function toNormalizedEvent(eb: EventbriteEvent): NormalizedEvent | null {
	const title = eb.name?.text?.trim();
	if (!title) return null;

	const startAt = new Date(eb.start.utc);
	if (isNaN(startAt.getTime())) return null;

	const endAt = eb.end ? new Date(eb.end.utc) : null;

	let location: string | null = null;
	let lat: number | null = null;
	let lon: number | null = null;

	if (eb.venue) {
		location = eb.venue.name || eb.venue.address?.localized_address_display || null;
		lat = eb.venue.address?.latitude ? parseFloat(eb.venue.address.latitude) : null;
		lon = eb.venue.address?.longitude ? parseFloat(eb.venue.address.longitude) : null;
	}

	let priceInfo: string | null = null;
	if (eb.is_free) {
		priceInfo = 'Eintritt frei';
	} else if (eb.ticket_availability?.minimum_ticket_price) {
		const min = eb.ticket_availability.minimum_ticket_price.display;
		const max = eb.ticket_availability.maximum_ticket_price?.display;
		priceInfo = max && max !== min ? `${min} – ${max}` : min;
	}

	return {
		title,
		description: eb.description?.text?.slice(0, 2000) ?? null,
		location,
		lat,
		lon,
		startAt,
		endAt,
		allDay: false,
		imageUrl: eb.logo?.url ?? null,
		sourceUrl: eb.url,
		category: eb.category_id ? (CATEGORY_MAP[eb.category_id] ?? 'other') : null,
		priceInfo,
		externalId: `eventbrite:${eb.id}`,
	};
}
