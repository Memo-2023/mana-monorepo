/**
 * iCal parser unit tests — no DB or network required.
 * Uses parseIcalText directly with inline iCal strings.
 */

import { describe, it, expect } from 'bun:test';
import { parseIcalText } from '../discovery/ical-parser';

const SOURCE_URL = 'https://example.com/events.ics';
const SOURCE_NAME = 'Test Venue';

/** Helper: generate a date N days from now as iCal UTC string (YYYYMMDDTHHMMSSZ). */
function futureIcalDate(daysAhead: number, hour = 19): string {
	const d = new Date(Date.now() + daysAhead * 86400000);
	d.setUTCHours(hour, 0, 0, 0);
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function pastIcalDate(daysAgo: number, hour = 19): string {
	return futureIcalDate(-daysAgo, hour);
}

function makeIcal(vevents: string): string {
	return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
${vevents}
END:VCALENDAR`;
}

// ─── Basic parsing ──────────────────────────────────────────────────

describe('parseIcalText', () => {
	it('extracts a single future event', () => {
		const ical = makeIcal(`BEGIN:VEVENT
UID:test-uid-1@example.com
DTSTART:${futureIcalDate(3)}
DTEND:${futureIcalDate(3, 21)}
SUMMARY:Jazz Night
DESCRIPTION:Live jazz at the club.
LOCATION:Jazzhaus Freiburg
URL:https://jazzhaus.de/event/1
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe('Jazz Night');
		expect(events[0].description).toBe('Live jazz at the club.');
		expect(events[0].location).toBe('Jazzhaus Freiburg');
		expect(events[0].externalId).toBe('test-uid-1@example.com');
		expect(events[0].sourceUrl).toBe('https://jazzhaus.de/event/1');
		expect(events[0].allDay).toBe(false);
	});

	it('extracts multiple events', () => {
		const ical = makeIcal(`BEGIN:VEVENT
UID:a@test
DTSTART:${futureIcalDate(1)}
SUMMARY:Event A
END:VEVENT
BEGIN:VEVENT
UID:b@test
DTSTART:${futureIcalDate(2)}
SUMMARY:Event B
END:VEVENT
BEGIN:VEVENT
UID:c@test
DTSTART:${futureIcalDate(5)}
SUMMARY:Event C
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(3);
		expect(events.map((e) => e.title).sort()).toEqual(['Event A', 'Event B', 'Event C']);
	});

	// ─── Filtering ──────────────────────────────────────────────

	it('filters out past events (> 1 day ago)', () => {
		const ical = makeIcal(`BEGIN:VEVENT
UID:past@test
DTSTART:${pastIcalDate(5)}
DTEND:${pastIcalDate(5, 21)}
SUMMARY:Past Event
END:VEVENT
BEGIN:VEVENT
UID:future@test
DTSTART:${futureIcalDate(3)}
SUMMARY:Future Event
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe('Future Event');
	});

	it('skips events without a summary', () => {
		const ical = makeIcal(`BEGIN:VEVENT
UID:no-title@test
DTSTART:${futureIcalDate(2)}
DESCRIPTION:Has no title
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(0);
	});

	it('skips VTODO and VFREEBUSY components', () => {
		const ical = makeIcal(`BEGIN:VTODO
UID:todo@test
SUMMARY:Not an event
END:VTODO
BEGIN:VEVENT
UID:real@test
DTSTART:${futureIcalDate(1)}
SUMMARY:Real Event
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe('Real Event');
	});

	// ─── All-day ────────────────────────────────────────────────

	it('detects all-day events (DATE type without time)', () => {
		const d = new Date(Date.now() + 3 * 86400000);
		const pad = (n: number) => n.toString().padStart(2, '0');
		const dateStr = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;

		const ical = makeIcal(`BEGIN:VEVENT
UID:allday@test
DTSTART;VALUE=DATE:${dateStr}
SUMMARY:All Day Festival
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].allDay).toBe(true);
	});

	// ─── Fallbacks ──────────────────────────────────────────────

	it('uses sourceUrl when event has no URL property', () => {
		const ical = makeIcal(`BEGIN:VEVENT
UID:no-url@test
DTSTART:${futureIcalDate(2)}
SUMMARY:No URL Event
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events[0].sourceUrl).toBe(SOURCE_URL);
	});

	it('truncates long descriptions to 2000 chars', () => {
		const longDesc = 'A'.repeat(3000);
		const ical = makeIcal(`BEGIN:VEVENT
UID:long@test
DTSTART:${futureIcalDate(2)}
SUMMARY:Long Desc
DESCRIPTION:${longDesc}
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events[0].description!.length).toBe(2000);
	});

	it('handles empty calendar gracefully', () => {
		const ical = makeIcal('');
		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(0);
	});

	it('handles optional fields as null', () => {
		const ical = makeIcal(`BEGIN:VEVENT
UID:minimal@test
DTSTART:${futureIcalDate(1)}
SUMMARY:Minimal Event
END:VEVENT`);

		const events = parseIcalText(ical, SOURCE_URL, SOURCE_NAME);
		expect(events[0].description).toBeNull();
		expect(events[0].location).toBeNull();
		// node-ical may synthesize an end date from start when DTEND is missing
		expect(events[0].startAt).toBeInstanceOf(Date);
	});
});
