/**
 * Website extractor unit tests — tests the JSON parsing and date handling
 * without hitting real LLM or mana-research services.
 */

import { describe, it, expect } from 'bun:test';
import { parseExtractedEvents } from '../discovery/website-extractor';

const SOURCE_URL = 'https://jazzhaus.de/programm';
const SOURCE_NAME = 'Jazzhaus Freiburg';

describe('parseExtractedEvents', () => {
	it('parses a well-formed JSON response', () => {
		const futureYear = new Date().getFullYear() + 1;
		const json = JSON.stringify({
			events: [
				{
					title: 'Jazz Night',
					date: `${futureYear}-05-15`,
					time: '20:00',
					location: 'Jazzhaus Freiburg',
					category: 'music',
					priceInfo: '15 EUR',
				},
				{
					title: 'Rock Festival',
					date: `${futureYear}-06-20`,
					location: 'Stadtpark',
					category: 'music',
				},
			],
		});

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(2);
		expect(events[0].title).toBe('Jazz Night');
		expect(events[0].location).toBe('Jazzhaus Freiburg');
		expect(events[0].category).toBe('music');
		expect(events[0].priceInfo).toBe('15 EUR');
		expect(events[0].allDay).toBe(false); // has time
		expect(events[1].title).toBe('Rock Festival');
		expect(events[1].allDay).toBe(true); // no time
	});

	it('handles markdown-fenced JSON', () => {
		const futureYear = new Date().getFullYear() + 1;
		const json = `\`\`\`json
{
  "events": [
    {"title": "Test", "date": "${futureYear}-03-01", "time": "19:00"}
  ]
}
\`\`\``;

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe('Test');
	});

	it('parses German date format (DD.MM.YYYY)', () => {
		const futureYear = new Date().getFullYear() + 1;
		const json = JSON.stringify({
			events: [{ title: 'Fest', date: `15.06.${futureYear}`, time: '18:00' }],
		});

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].startAt.getFullYear()).toBe(futureYear);
		expect(events[0].startAt.getMonth()).toBe(5); // June = 5
	});

	it('filters out past events', () => {
		const json = JSON.stringify({
			events: [
				{ title: 'Past Event', date: '2020-01-01', time: '19:00' },
				{ title: 'Future Event', date: '2030-01-01', time: '19:00' },
			],
		});

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe('Future Event');
	});

	it('skips events without title or date', () => {
		const json = JSON.stringify({
			events: [
				{ title: 'Valid', date: '2030-01-01' },
				{ title: '', date: '2030-01-02' },
				{ title: 'No Date' },
				{ date: '2030-01-03' },
			],
		});

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].title).toBe('Valid');
	});

	it('truncates long titles and descriptions', () => {
		const json = JSON.stringify({
			events: [
				{
					title: 'A'.repeat(300),
					date: '2030-01-01',
					description: 'B'.repeat(3000),
				},
			],
		});

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events[0].title.length).toBe(200);
		expect(events[0].description!.length).toBe(2000);
	});

	it('handles empty/invalid JSON gracefully', () => {
		expect(parseExtractedEvents('', SOURCE_URL, SOURCE_NAME)).toHaveLength(0);
		expect(parseExtractedEvents('not json', SOURCE_URL, SOURCE_NAME)).toHaveLength(0);
		expect(parseExtractedEvents('{}', SOURCE_URL, SOURCE_NAME)).toHaveLength(0);
		expect(parseExtractedEvents('{"events": "not array"}', SOURCE_URL, SOURCE_NAME)).toHaveLength(
			0
		);
	});

	it('handles endDate and endTime', () => {
		const futureYear = new Date().getFullYear() + 1;
		const json = JSON.stringify({
			events: [
				{
					title: 'Festival',
					date: `${futureYear}-07-01`,
					time: '10:00',
					endDate: `${futureYear}-07-03`,
					endTime: '23:00',
				},
			],
		});

		const events = parseExtractedEvents(json, SOURCE_URL, SOURCE_NAME);
		expect(events).toHaveLength(1);
		expect(events[0].endAt).not.toBeNull();
		expect(events[0].endAt!.getDate()).toBe(3);
	});
});
