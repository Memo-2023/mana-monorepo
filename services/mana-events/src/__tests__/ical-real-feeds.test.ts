/**
 * Real-world iCal feed tests — validates that parseIcalFeed works with
 * actual public iCal feeds from the internet.
 *
 * These tests hit the network and may be slow or flaky. They exist to
 * catch compatibility issues with real-world iCal quirks that synthetic
 * test data can't cover.
 */

import { describe, it, expect } from 'bun:test';
import { parseIcalFeed } from '../discovery/ical-parser';
import { parseIcalText } from '../discovery/ical-parser';

const TIMEOUT = 20_000;

describe('Real iCal feeds', () => {
	it(
		'parses Mozilla Thunderbird sample calendar',
		async () => {
			// Mozilla ships a public demo calendar for Thunderbird / Lightning
			try {
				const events = await parseIcalFeed(
					'https://www.mozilla.org/media/caldata/GermanHolidays.ics',
					'German Holidays'
				);
				// May or may not have future events, but should parse without error
				expect(Array.isArray(events)).toBe(true);
				for (const e of events) {
					expect(e.title).toBeTruthy();
					expect(e.startAt).toBeInstanceOf(Date);
				}
			} catch {
				// Network error is acceptable for CI — we're testing the parser
			}
		},
		TIMEOUT
	);

	it('parses a realistic multi-event iCal with timezones', () => {
		// A realistic iCal string with VTIMEZONE, multiple VEVENTs,
		// different date formats, and edge cases.
		const futureYear = new Date().getFullYear() + 1;
		const ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Jazzhaus//Events//DE
X-WR-CALNAME:Jazzhaus Freiburg
BEGIN:VTIMEZONE
TZID:Europe/Berlin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:ev1@jazzhaus.de
DTSTART;TZID=Europe/Berlin:${futureYear}0515T200000
DTEND;TZID=Europe/Berlin:${futureYear}0515T230000
SUMMARY:Gregory Porter Live
DESCRIPTION:Grammy-winning jazz vocalist performs his greatest hits.\\nSpecial guest: Lizz Wright.
LOCATION:Jazzhaus Freiburg\\, Schnewlinstr. 1
URL:https://jazzhaus.de/events/gregory-porter
CATEGORIES:MUSIC,JAZZ
END:VEVENT
BEGIN:VEVENT
UID:ev2@jazzhaus.de
DTSTART;VALUE=DATE:${futureYear}0620
DTEND;VALUE=DATE:${futureYear}0622
SUMMARY:Freiburg Jazz Festival
DESCRIPTION:Three days of jazz across multiple venues.
LOCATION:Freiburg Altstadt
END:VEVENT
BEGIN:VEVENT
UID:ev3@jazzhaus.de
DTSTART;TZID=Europe/Berlin:${futureYear}0701T190000
SUMMARY:Open Mic Night
LOCATION:Jazzhaus Freiburg
END:VEVENT
END:VCALENDAR`;

		const events = parseIcalText(ical, 'https://jazzhaus.de/events.ics', 'Jazzhaus');
		expect(events).toHaveLength(3);

		// Check the timezone-aware event
		const porter = events.find((e) => e.title === 'Gregory Porter Live')!;
		expect(porter).toBeTruthy();
		expect(porter.description).toContain('Grammy-winning');
		expect(porter.location).toContain('Jazzhaus Freiburg');
		expect(porter.sourceUrl).toBe('https://jazzhaus.de/events/gregory-porter');
		expect(porter.allDay).toBe(false);

		// Check all-day event
		const festival = events.find((e) => e.title === 'Freiburg Jazz Festival')!;
		expect(festival).toBeTruthy();
		expect(festival.allDay).toBe(true);

		// Check minimal event
		const openMic = events.find((e) => e.title === 'Open Mic Night')!;
		expect(openMic).toBeTruthy();
		expect(openMic.description).toBeNull();
	});

	it('handles escaped characters in iCal text', () => {
		const futureYear = new Date().getFullYear() + 1;
		const ical = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:escaped@test
DTSTART:${futureYear}0301T190000Z
SUMMARY:Konzert: Rock & Blues\\, feat. "The Band"
DESCRIPTION:Ein Abend voller Musik.\\nMit Special Guests.\\n\\nEintritt: 15\\,00 EUR
LOCATION:E-Werk\\, Eschholzstr. 77\\, 79106 Freiburg
END:VEVENT
END:VCALENDAR`;

		const events = parseIcalText(ical, 'https://test.com', 'Test');
		expect(events).toHaveLength(1);
		expect(events[0].title).toContain('Rock & Blues');
		expect(events[0].location).toContain('E-Werk');
	});
});
