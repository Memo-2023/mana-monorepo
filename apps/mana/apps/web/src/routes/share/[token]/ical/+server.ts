/**
 * iCal download for unlisted-shared calendar events.
 *
 * Fetches the same snapshot the /share/[token] page renders, then
 * serialises it to RFC 5545. Only 'events' snapshots return a file;
 * other collections get 400.
 *
 * See docs/plans/unlisted-sharing.md §7.
 */

import { error } from '@sveltejs/kit';
import { getManaApiUrl } from '$lib/api/config';
import type { RequestHandler } from './$types';

interface SnapshotResponse {
	token: string;
	collection: string;
	blob: Record<string, unknown>;
}

interface EventBlob {
	title: string;
	startTime: string;
	endTime: string;
	isAllDay: boolean;
	timezone: string | null;
	location: string | null;
}

export const GET: RequestHandler = async ({ params, fetch }) => {
	const token = params.token;
	if (!token || !/^[A-Za-z0-9_-]{32}$/.test(token)) {
		error(404, 'Link nicht gefunden');
	}

	const res = await fetch(`${getManaApiUrl()}/api/v1/unlisted/public/${token}`);
	if (res.status === 404) error(404, 'Link nicht gefunden');
	if (res.status === 410) error(410, 'Link nicht mehr gültig');
	if (!res.ok) error(502, 'Fehler beim Laden');

	const payload = (await res.json()) as SnapshotResponse;
	if (payload.collection !== 'events') {
		error(400, 'iCal-Export nur für Kalender-Termine verfügbar');
	}

	const event = payload.blob as unknown as EventBlob;
	const ics = buildIcs(token, event);

	return new Response(ics, {
		status: 200,
		headers: {
			'content-type': 'text/calendar; charset=utf-8',
			'content-disposition': `attachment; filename="event-${token.slice(0, 8)}.ics"`,
			'cache-control': 'private, max-age=60',
		},
	});
};

/**
 * Build a minimal RFC 5545 iCalendar body. No library — the fields we
 * inline are trivial enough. Escaping per the spec: commas,
 * semicolons and backslashes in TEXT fields are `\\`-escaped; newlines
 * become `\\n`.
 */
function buildIcs(token: string, event: EventBlob): string {
	const uid = `unlisted-${token}@mana.how`;
	const now = formatIcsUtc(new Date());

	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Mana//Unlisted Event//DE',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${now}`,
		...formatDtStartEnd(event),
		`SUMMARY:${escapeIcs(event.title)}`,
	];
	if (event.location) {
		lines.push(`LOCATION:${escapeIcs(event.location)}`);
	}
	lines.push('END:VEVENT', 'END:VCALENDAR');

	// Line endings per spec: CRLF.
	return lines.join('\r\n') + '\r\n';
}

function formatDtStartEnd(event: EventBlob): string[] {
	if (event.isAllDay) {
		return [
			`DTSTART;VALUE=DATE:${formatIcsDate(new Date(event.startTime))}`,
			`DTEND;VALUE=DATE:${formatIcsDate(new Date(event.endTime))}`,
		];
	}
	return [
		`DTSTART:${formatIcsUtc(new Date(event.startTime))}`,
		`DTEND:${formatIcsUtc(new Date(event.endTime))}`,
	];
}

function pad(n: number): string {
	return String(n).padStart(2, '0');
}

function formatIcsUtc(d: Date): string {
	return (
		d.getUTCFullYear().toString() +
		pad(d.getUTCMonth() + 1) +
		pad(d.getUTCDate()) +
		'T' +
		pad(d.getUTCHours()) +
		pad(d.getUTCMinutes()) +
		pad(d.getUTCSeconds()) +
		'Z'
	);
}

function formatIcsDate(d: Date): string {
	return d.getFullYear().toString() + pad(d.getMonth() + 1) + pad(d.getDate());
}

function escapeIcs(s: string): string {
	return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
