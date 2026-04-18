/**
 * Meetup provider — fetches events from the Meetup GraphQL API.
 *
 * Uses the public GraphQL endpoint which requires an API key (OAuth token).
 * Free for read operations.
 *
 * API docs: https://www.meetup.com/api/schema/#p02-GraphQL-API
 *
 * When no API key is configured, this provider is a no-op (returns empty).
 */

import type { EventProvider, ProviderContext, ProviderResult } from './base';
import type { NormalizedEvent } from '../types';

const GRAPHQL_URL = 'https://api.meetup.com/gql';
const FETCH_TIMEOUT_MS = 15_000;

/** Meetup topic category → our category mapping. */
const TOPIC_CATEGORY_MAP: Record<string, string> = {
	tech: 'tech',
	'science-tech': 'tech',
	music: 'music',
	'arts-culture': 'art',
	sports: 'sport',
	'food-drink': 'food',
	'outdoors-adventure': 'nature',
	'health-wellbeing': 'education',
	'language-ethnic-identity': 'community',
	'social-activities': 'community',
	career: 'education',
	education: 'education',
	'parents-family': 'family',
};

const SEARCH_EVENTS_QUERY = `
query SearchEvents($filter: SearchConnectionFilter!) {
  keywordSearch(filter: $filter) {
    edges {
      node {
        id
        result {
          ... on Event {
            id
            title
            description
            dateTime
            endTime
            eventUrl
            going
            venue {
              name
              address
              city
              state
              lat
              lng
            }
            featuredEventPhoto {
              highResUrl
            }
            group {
              name
              topicCategory {
                urlkey
              }
            }
            feeSettings {
              amount
              currency
            }
          }
        }
      }
    }
  }
}
`;

interface MeetupEvent {
	id: string;
	title: string;
	description: string | null;
	dateTime: string;
	endTime: string | null;
	eventUrl: string;
	going: number;
	venue: {
		name: string;
		address: string;
		city: string;
		state: string;
		lat: number;
		lng: number;
	} | null;
	featuredEventPhoto: { highResUrl: string } | null;
	group: {
		name: string;
		topicCategory: { urlkey: string } | null;
	};
	feeSettings: { amount: number; currency: string } | null;
}

function getApiKey(): string | null {
	return process.env.MEETUP_API_KEY || null;
}

export const meetupProvider: EventProvider = {
	type: 'meetup',

	async fetchEvents(_url: string, _name: string, ctx?: ProviderContext): Promise<ProviderResult> {
		const apiKey = getApiKey();
		if (!apiKey) {
			return { events: [], error: 'MEETUP_API_KEY not configured' };
		}

		if (!ctx?.lat || !ctx?.lon) {
			return { events: [], error: 'Region coordinates required for Meetup search' };
		}

		try {
			const res = await fetch(GRAPHQL_URL, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`,
				},
				body: JSON.stringify({
					query: SEARCH_EVENTS_QUERY,
					variables: {
						filter: {
							query: ctx.regionLabel ?? '',
							lat: ctx.lat,
							lon: ctx.lon,
							radius: ctx.radiusKm ?? 25,
							source: 'EVENTS',
							startDateRange: new Date().toISOString(),
						},
					},
				}),
				signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
			});

			if (!res.ok) {
				const body = await res.text().catch(() => '');
				return { events: [], error: `Meetup API ${res.status}: ${body.slice(0, 200)}` };
			}

			const data = await res.json();
			const edges = data?.data?.keywordSearch?.edges ?? [];
			const events: NormalizedEvent[] = [];

			for (const edge of edges) {
				const node = edge?.node?.result;
				if (!node || !node.title) continue;

				const normalized = toNormalizedEvent(node);
				if (normalized) events.push(normalized);
			}

			return { events };
		} catch (err) {
			return {
				events: [],
				error: err instanceof Error ? err.message : 'Meetup fetch failed',
			};
		}
	},
};

function toNormalizedEvent(m: MeetupEvent): NormalizedEvent | null {
	const title = m.title?.trim();
	if (!title) return null;

	const startAt = new Date(m.dateTime);
	if (isNaN(startAt.getTime())) return null;

	// Skip past events
	if (startAt.getTime() < Date.now() - 24 * 60 * 60 * 1000) return null;

	const endAt = m.endTime ? new Date(m.endTime) : null;

	let location: string | null = null;
	let lat: number | null = null;
	let lon: number | null = null;

	if (m.venue) {
		const parts = [m.venue.name, m.venue.address, m.venue.city].filter(Boolean);
		location = parts.join(', ') || null;
		lat = m.venue.lat || null;
		lon = m.venue.lng || null;
	}

	let priceInfo: string | null = null;
	if (m.feeSettings) {
		priceInfo = `${m.feeSettings.amount} ${m.feeSettings.currency}`;
	}

	const topicKey = m.group?.topicCategory?.urlkey;
	const category = topicKey ? (TOPIC_CATEGORY_MAP[topicKey] ?? 'community') : 'community';

	// Strip HTML from description
	const description = m.description
		? m.description
				.replace(/<[^>]*>/g, '')
				.trim()
				.slice(0, 2000)
		: null;

	return {
		title,
		description,
		location,
		lat,
		lon,
		startAt,
		endAt,
		allDay: false,
		imageUrl: m.featuredEventPhoto?.highResUrl ?? null,
		sourceUrl: m.eventUrl,
		category,
		priceInfo,
		externalId: `meetup:${m.id}`,
	};
}
