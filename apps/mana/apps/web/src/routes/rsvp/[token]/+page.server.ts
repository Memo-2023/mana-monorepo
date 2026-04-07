/**
 * Public RSVP page — server-side load.
 *
 * Fetches the published event snapshot from mana-events. No auth required.
 */

import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const EVENTS_URL =
	process.env.PUBLIC_MANA_EVENTS_URL_CLIENT ||
	process.env.PUBLIC_MANA_EVENTS_URL ||
	'http://localhost:3065';

type Lang = 'de' | 'en';

/** Pick the best supported language from an Accept-Language header. */
function pickLang(header: string | null): Lang {
	if (!header) return 'de';
	// Header looks like "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
	const parts = header.split(',').map((p) => p.trim().split(';')[0].toLowerCase().slice(0, 2));
	for (const p of parts) {
		if (p === 'de') return 'de';
		if (p === 'en') return 'en';
	}
	return 'de';
}

interface EventSnapshot {
	token: string;
	title: string;
	description: string | null;
	location: string | null;
	locationUrl: string | null;
	startAt: string;
	endAt: string | null;
	allDay: boolean;
	coverImageUrl: string | null;
	color: string | null;
	capacity: number | null;
}

interface RsvpSummary {
	yes: number;
	no: number;
	maybe: number;
	totalAttending: number;
}

export const load: PageServerLoad = async ({ params, fetch, request }) => {
	const token = params.token;
	if (!token) throw error(404, 'Not found');

	const lang = pickLang(request.headers.get('accept-language'));
	const notFoundMsg = lang === 'de' ? 'Event nicht gefunden' : 'Event not found';
	const errorMsg = lang === 'de' ? 'Konnte Event nicht laden' : 'Could not load event';

	try {
		const res = await fetch(`${EVENTS_URL}/api/v1/rsvp/${encodeURIComponent(token)}`);
		if (res.status === 404) throw error(404, notFoundMsg);
		if (!res.ok) throw error(500, errorMsg);
		const data = (await res.json()) as {
			event: EventSnapshot;
			summary: RsvpSummary | null;
			cancelled?: boolean;
		};
		return { token, ...data, eventsUrl: EVENTS_URL, lang };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, errorMsg);
	}
};
