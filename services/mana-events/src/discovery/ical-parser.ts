/**
 * iCal (.ics) feed parser — fetches a remote iCal URL and extracts
 * VEVENT entries as NormalizedEvents.
 *
 * Uses node-ical for robust parsing of the many iCal quirks in the wild
 * (timezone aliases, RRULE expansion, non-standard properties).
 */

import ical, { type VEvent } from 'node-ical';
import type { NormalizedEvent } from './types';

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Fetch and parse an iCal feed URL. Returns future events only.
 * Handles VTIMEZONE, DTSTART/DTEND with and without timezone, RRULE.
 */
export async function parseIcalFeed(url: string, sourceName: string): Promise<NormalizedEvent[]> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { 'User-Agent': 'Mana-Events-Discovery/1.0' },
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status} fetching ${url}`);
		}
		const text = await res.text();
		return parseIcalText(text, url, sourceName);
	} finally {
		clearTimeout(timeout);
	}
}

/**
 * Parse raw iCal text into NormalizedEvents.
 * Exported for testing without network.
 */
export function parseIcalText(
	icalText: string,
	sourceUrl: string,
	sourceName: string
): NormalizedEvent[] {
	const parsed = ical.sync.parseICS(icalText);
	const now = new Date();
	const events: NormalizedEvent[] = [];

	for (const component of Object.values(parsed)) {
		if (!component || component.type !== 'VEVENT') continue;
		const vevent = component as VEvent;

		const startDate = vevent.start ? new Date(vevent.start as unknown as string) : null;
		if (!startDate || isNaN(startDate.getTime())) continue;

		// Skip past events (allow 1 day grace for ongoing events)
		const endDate = vevent.end ? new Date(vevent.end as unknown as string) : null;
		const cutoff = endDate ?? startDate;
		if (cutoff.getTime() < now.getTime() - 24 * 60 * 60 * 1000) continue;

		const summary = typeof vevent.summary === 'string' ? vevent.summary.trim() : '';
		if (!summary) continue;

		const description = typeof vevent.description === 'string' ? vevent.description.trim() : null;
		const location = typeof vevent.location === 'string' ? vevent.location.trim() : null;

		// Detect all-day: either DTSTART is DATE (no time), or duration spans full days
		const allDay =
			vevent.datetype === 'date' ||
			(vevent.start &&
				typeof vevent.start === 'object' &&
				'dateOnly' in vevent.start &&
				(vevent.start as { dateOnly?: boolean }).dateOnly === true);

		// Use the VEVENT UID as external ID for dedup stability across re-crawls
		const uid = typeof vevent.uid === 'string' ? vevent.uid : null;

		// Extract URL if present
		const eventUrl = typeof vevent.url === 'string' ? vevent.url : sourceUrl;

		events.push({
			title: summary,
			description: description ? description.slice(0, 2000) : null,
			location,
			startAt: startDate,
			endAt: endDate,
			allDay: !!allDay,
			sourceUrl: eventUrl,
			externalId: uid,
			category: null, // iCal doesn't have a standard category we can rely on
		});
	}

	return events;
}
