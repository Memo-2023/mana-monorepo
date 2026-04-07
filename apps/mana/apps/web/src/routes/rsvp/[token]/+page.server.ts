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

export const load: PageServerLoad = async ({ params, fetch }) => {
	const token = params.token;
	if (!token) throw error(404, 'Not found');

	try {
		const res = await fetch(`${EVENTS_URL}/api/v1/rsvp/${encodeURIComponent(token)}`);
		if (res.status === 404) throw error(404, 'Event nicht gefunden');
		if (!res.ok) throw error(500, 'Konnte Event nicht laden');
		const data = (await res.json()) as {
			event: EventSnapshot;
			summary: RsvpSummary | null;
			cancelled?: boolean;
		};
		return { token, ...data, eventsUrl: EVENTS_URL };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(500, 'Konnte Event nicht laden');
	}
};
