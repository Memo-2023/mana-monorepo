import { describe, it, expect } from 'vitest';
import {
	extractDate,
	extractDateRange,
	extractTime,
	extractTimezone,
	extractAtReferences,
	extractRecurrence,
	extractRelativeTime,
	fuzzyMatchDateKeyword,
	createAppParser,
	parseBaseInput,
	formatDatePreview,
} from './base-parser';
import { addDays } from 'date-fns';

// ============================================================================
// German (de) - was already working, verify still works
// ============================================================================

describe('German (de)', () => {
	it('should parse "heute"', () => {
		const result = extractDate('Meeting heute', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(new Date().toDateString());
		expect(result.remaining).toBe('Meeting');
	});

	it('should parse "morgen"', () => {
		const result = extractDate('morgen Termin', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 1).toDateString());
	});

	it('should parse "übermorgen"', () => {
		const result = extractDate('übermorgen', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 2).toDateString());
	});

	it('should parse "in 3 Tagen"', () => {
		const result = extractDate('in 3 Tagen', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 3).toDateString());
	});

	it('should parse "14 Uhr"', () => {
		const result = extractTime('um 14 Uhr', 'de');
		expect(result.value).toEqual({ hours: 14, minutes: 0 });
	});

	it('should parse DD.MM. date', () => {
		const result = extractDate('15.12.', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.getDate()).toBe(15);
		expect(result.value!.getMonth()).toBe(11); // December
	});

	it('should format preview as Heute/Morgen', () => {
		expect(formatDatePreview(new Date(), 'de')).toBe('Heute');
		expect(formatDatePreview(addDays(new Date(), 1), 'de')).toBe('Morgen');
	});
});

// ============================================================================
// English (en)
// ============================================================================

describe('English (en)', () => {
	it('should parse "today"', () => {
		const result = extractDate('Meeting today', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(new Date().toDateString());
		expect(result.remaining).toBe('Meeting');
	});

	it('should parse "tomorrow"', () => {
		const result = extractDate('tomorrow meeting', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 1).toDateString());
	});

	it('should parse "in 5 days"', () => {
		const result = extractDate('in 5 days', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 5).toDateString());
	});

	it('should parse "next week"', () => {
		const result = extractDate('next week', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 7).toDateString());
	});

	it('should parse weekday "monday"', () => {
		const result = extractDate('monday meeting', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.getDay()).toBe(1); // Monday
	});

	it('should parse "next friday"', () => {
		const result = extractDate('next friday', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.getDay()).toBe(5); // Friday
	});

	it('should parse "at 2pm"', () => {
		const result = extractTime('at 2pm', 'en');
		expect(result.value).toEqual({ hours: 14, minutes: 0 });
	});

	it('should parse "3:30"', () => {
		const result = extractTime('3:30', 'en');
		expect(result.value).toEqual({ hours: 3, minutes: 30 });
	});

	it('should parse MM/DD date', () => {
		const result = extractDate('12/25', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.getMonth()).toBe(11); // December
		expect(result.value!.getDate()).toBe(25);
	});

	it('should format preview as Today/Tomorrow', () => {
		expect(formatDatePreview(new Date(), 'en')).toBe('Today');
		expect(formatDatePreview(addDays(new Date(), 1), 'en')).toBe('Tomorrow');
	});

	it('should parse full input in English', () => {
		const result = parseBaseInput('Meeting tomorrow 14:00 #important', 'en');
		expect(result.title).toBe('Meeting');
		expect(result.date).toBeDefined();
		expect(result.time).toEqual({ hours: 14, minutes: 0 });
		expect(result.tagNames).toEqual(['important']);
	});
});

// ============================================================================
// French (fr)
// ============================================================================

describe('French (fr)', () => {
	it('should parse "demain"', () => {
		const result = extractDate('réunion demain', 'fr');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 1).toDateString());
	});

	it('should parse "dans 3 jours"', () => {
		const result = extractDate('dans 3 jours', 'fr');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 3).toDateString());
	});

	it('should parse weekday "lundi"', () => {
		const result = extractDate('lundi réunion', 'fr');
		expect(result.value).toBeDefined();
		expect(result.value!.getDay()).toBe(1); // Monday
	});

	it('should parse time "14h30"', () => {
		const result = extractTime('à 14h30', 'fr');
		expect(result.value).toEqual({ hours: 14, minutes: 30 });
	});

	it("should format preview as Aujourd'hui/Demain", () => {
		expect(formatDatePreview(new Date(), 'fr')).toBe("Aujourd'hui");
		expect(formatDatePreview(addDays(new Date(), 1), 'fr')).toBe('Demain');
	});
});

// ============================================================================
// Spanish (es)
// ============================================================================

describe('Spanish (es)', () => {
	it('should parse "hoy"', () => {
		const result = extractDate('reunión hoy', 'es');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(new Date().toDateString());
	});

	it('should parse "mañana"', () => {
		const result = extractDate('mañana reunión', 'es');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 1).toDateString());
	});

	it('should parse "en 2 días"', () => {
		const result = extractDate('en 2 días', 'es');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 2).toDateString());
	});

	it('should parse weekday "lunes"', () => {
		const result = extractDate('lunes', 'es');
		expect(result.value).toBeDefined();
		expect(result.value!.getDay()).toBe(1);
	});

	it('should format preview as Hoy/Mañana', () => {
		expect(formatDatePreview(new Date(), 'es')).toBe('Hoy');
		expect(formatDatePreview(addDays(new Date(), 1), 'es')).toBe('Mañana');
	});
});

// ============================================================================
// Italian (it)
// ============================================================================

describe('Italian (it)', () => {
	it('should parse "oggi"', () => {
		const result = extractDate('riunione oggi', 'it');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(new Date().toDateString());
	});

	it('should parse "domani"', () => {
		const result = extractDate('domani riunione', 'it');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 1).toDateString());
	});

	it('should parse "dopodomani"', () => {
		const result = extractDate('dopodomani', 'it');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 2).toDateString());
	});

	it('should parse "tra 5 giorni"', () => {
		const result = extractDate('tra 5 giorni', 'it');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 5).toDateString());
	});

	it('should parse weekday "lunedì"', () => {
		const result = extractDate('lunedì', 'it');
		expect(result.value).toBeDefined();
		expect(result.value!.getDay()).toBe(1);
	});

	it('should format preview as Oggi/Domani', () => {
		expect(formatDatePreview(new Date(), 'it')).toBe('Oggi');
		expect(formatDatePreview(addDays(new Date(), 1), 'it')).toBe('Domani');
	});
});

// ============================================================================
// Multiple @references
// ============================================================================

describe('extractAtReferences', () => {
	it('should extract multiple @references', () => {
		const result = extractAtReferences('Meeting @Arbeit @Max');
		expect(result.value).toEqual(['Arbeit', 'Max']);
		expect(result.remaining).toBe('Meeting');
	});

	it('should extract single @reference', () => {
		const result = extractAtReferences('Task @Projekt');
		expect(result.value).toEqual(['Projekt']);
	});

	it('should return undefined for no references', () => {
		const result = extractAtReferences('Just text');
		expect(result.value).toBeUndefined();
	});
});

// ============================================================================
// Timezone Extraction
// ============================================================================

describe('Timezone', () => {
	it('should extract CET', () => {
		const result = extractTimezone('Meeting 14 Uhr CET');
		expect(result.value).toBe('Europe/Berlin');
		expect(result.remaining).toBe('Meeting 14 Uhr');
	});

	it('should extract EST', () => {
		const result = extractTimezone('Call at 3pm EST');
		expect(result.value).toBe('America/New_York');
	});

	it('should extract UTC', () => {
		const result = extractTimezone('Deploy 10:00 UTC');
		expect(result.value).toBe('UTC');
	});

	it('should return undefined for no timezone', () => {
		const result = extractTimezone('Normal text');
		expect(result.value).toBeUndefined();
	});
});

// ============================================================================
// Past Dates
// ============================================================================

describe('Past dates', () => {
	it('should parse "gestern" (de)', () => {
		const result = extractDate('gestern gemacht', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), -1).toDateString());
	});

	it('should parse "vorgestern" (de)', () => {
		const result = extractDate('vorgestern', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), -2).toDateString());
	});

	it('should parse "yesterday" (en)', () => {
		const result = extractDate('done yesterday', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), -1).toDateString());
	});

	it('should parse "hier" (fr)', () => {
		const result = extractDate('fait hier', 'fr');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), -1).toDateString());
	});

	it('should parse "ieri" (it)', () => {
		const result = extractDate('fatto ieri', 'it');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), -1).toDateString());
	});
});

// ============================================================================
// Relative Week Expressions
// ============================================================================

describe('Relative weeks', () => {
	it('should parse "übernächste Woche" (de)', () => {
		const result = extractDate('übernächste Woche', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 14).toDateString());
	});

	it('should parse "week after next" (en)', () => {
		const result = extractDate('week after next', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 14).toDateString());
	});

	it('should parse "in 3 Wochen" (de)', () => {
		const result = extractDate('in 3 Wochen', 'de');
		expect(result.value).toBeDefined();
		// 3 weeks = 21 days
		const expected = addDays(new Date(), 21);
		expect(result.value!.toDateString()).toBe(expected.toDateString());
	});

	it('should parse "in 2 weeks" (en)', () => {
		const result = extractDate('in 2 weeks', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 14).toDateString());
	});
});

// ============================================================================
// Month Names & Ordinal Dates
// ============================================================================

describe('Month names', () => {
	it('should parse "im März" (de)', () => {
		const result = extractDate('Termin im März', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.getMonth()).toBe(2); // March
	});

	it('should parse "in January" (en)', () => {
		const result = extractDate('meeting in January', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.getMonth()).toBe(0); // January
	});

	it('should parse "en février" (fr)', () => {
		const result = extractDate('réunion en février', 'fr');
		expect(result.value).toBeDefined();
		expect(result.value!.getMonth()).toBe(1); // February
	});
});

describe('Ordinal dates', () => {
	it('should parse "5. Dezember" (de)', () => {
		const result = extractDate('Termin 5. Dezember', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.getDate()).toBe(5);
		expect(result.value!.getMonth()).toBe(11); // December
	});

	it('should parse "3rd of May" (en)', () => {
		const result = extractDate('meeting 3rd of May', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.getDate()).toBe(3);
		expect(result.value!.getMonth()).toBe(4); // May
	});

	it('should parse "le 15 mars" (fr)', () => {
		const result = extractDate('réunion le 15 mars', 'fr');
		expect(result.value).toBeDefined();
		expect(result.value!.getDate()).toBe(15);
		expect(result.value!.getMonth()).toBe(2); // March
	});

	it('should parse "el 3 de mayo" (es)', () => {
		const result = extractDate('reunión el 3 de mayo', 'es');
		expect(result.value).toBeDefined();
		expect(result.value!.getDate()).toBe(3);
		expect(result.value!.getMonth()).toBe(4); // May
	});
});

// ============================================================================
// Recurrence Extraction
// ============================================================================

describe('Recurrence (de)', () => {
	it('should parse "täglich"', () => {
		const result = extractRecurrence('Standup täglich', 'de');
		expect(result.value).toBe('FREQ=DAILY');
		expect(result.remaining).toBe('Standup');
	});

	it('should parse "wöchentlich"', () => {
		const result = extractRecurrence('Meeting wöchentlich', 'de');
		expect(result.value).toBe('FREQ=WEEKLY');
	});

	it('should parse "jeden Montag"', () => {
		const result = extractRecurrence('Standup jeden Montag', 'de');
		expect(result.value).toBe('FREQ=WEEKLY;BYDAY=MO');
	});

	it('should parse "monatlich"', () => {
		const result = extractRecurrence('Review monatlich', 'de');
		expect(result.value).toBe('FREQ=MONTHLY');
	});

	it('should parse "alle 2 Wochen"', () => {
		const result = extractRecurrence('Sprint alle 2 Wochen', 'de');
		expect(result.value).toBe('FREQ=WEEKLY;INTERVAL=2');
	});

	it('should return undefined for no recurrence', () => {
		const result = extractRecurrence('Einfacher Termin', 'de');
		expect(result.value).toBeUndefined();
	});
});

describe('Recurrence (en)', () => {
	it('should parse "daily"', () => {
		const result = extractRecurrence('Standup daily', 'en');
		expect(result.value).toBe('FREQ=DAILY');
	});

	it('should parse "every Monday"', () => {
		const result = extractRecurrence('Standup every Monday', 'en');
		expect(result.value).toBe('FREQ=WEEKLY;BYDAY=MO');
	});

	it('should parse "every 3 weeks"', () => {
		const result = extractRecurrence('Sprint every 3 weeks', 'en');
		expect(result.value).toBe('FREQ=WEEKLY;INTERVAL=3');
	});

	it('should parse "monthly"', () => {
		const result = extractRecurrence('Review monthly', 'en');
		expect(result.value).toBe('FREQ=MONTHLY');
	});
});

describe('Recurrence (fr)', () => {
	it('should parse "quotidien"', () => {
		const result = extractRecurrence('Standup quotidien', 'fr');
		expect(result.value).toBe('FREQ=DAILY');
	});

	it('should parse "chaque lundi"', () => {
		const result = extractRecurrence('Réunion chaque lundi', 'fr');
		expect(result.value).toBe('FREQ=WEEKLY;BYDAY=MO');
	});
});

// ============================================================================
// Relative Time Expressions
// ============================================================================

describe('Relative time (de)', () => {
	it('should parse "in 2 Stunden"', () => {
		const now = Date.now();
		const result = extractRelativeTime('Meeting in 2 Stunden', 'de');
		expect(result.value).toBeDefined();
		const diff = result.value!.getTime() - now;
		expect(diff).toBeGreaterThan(110 * 60_000); // ~2h
		expect(diff).toBeLessThan(130 * 60_000);
		expect(result.remaining).toBe('Meeting');
	});

	it('should parse "in 30 Minuten"', () => {
		const now = Date.now();
		const result = extractRelativeTime('Call in 30 Minuten', 'de');
		expect(result.value).toBeDefined();
		const diff = result.value!.getTime() - now;
		expect(diff).toBeGreaterThan(25 * 60_000);
		expect(diff).toBeLessThan(35 * 60_000);
	});

	it('should parse "in einer halben Stunde"', () => {
		const now = Date.now();
		const result = extractRelativeTime('Termin in einer halben Stunde', 'de');
		expect(result.value).toBeDefined();
		const diff = result.value!.getTime() - now;
		expect(diff).toBeGreaterThan(25 * 60_000);
		expect(diff).toBeLessThan(35 * 60_000);
	});

	it('should return undefined for no match', () => {
		const result = extractRelativeTime('Normaler Text', 'de');
		expect(result.value).toBeUndefined();
	});
});

describe('Relative time (en)', () => {
	it('should parse "in 2 hours"', () => {
		const now = Date.now();
		const result = extractRelativeTime('Meeting in 2 hours', 'en');
		expect(result.value).toBeDefined();
		const diff = result.value!.getTime() - now;
		expect(diff).toBeGreaterThan(110 * 60_000);
		expect(diff).toBeLessThan(130 * 60_000);
	});

	it('should parse "in half an hour"', () => {
		const now = Date.now();
		const result = extractRelativeTime('Call in half an hour', 'en');
		expect(result.value).toBeDefined();
		const diff = result.value!.getTime() - now;
		expect(diff).toBeGreaterThan(25 * 60_000);
		expect(diff).toBeLessThan(35 * 60_000);
	});

	it('should parse "in 15 minutes"', () => {
		const result = extractRelativeTime('Break in 15 minutes', 'en');
		expect(result.value).toBeDefined();
	});
});

// ============================================================================
// Fuzzy Matching
// ============================================================================

describe('Fuzzy matching', () => {
	it('should match "morge" → "morgen"', () => {
		expect(fuzzyMatchDateKeyword('morge', 'de')).toBe('morgen');
	});

	it('should match "motag" → "montag"', () => {
		expect(fuzzyMatchDateKeyword('motag', 'de')).toBe('montag');
	});

	it('should match "donerstag" → "donnerstag"', () => {
		expect(fuzzyMatchDateKeyword('donerstag', 'de')).toBe('donnerstag');
	});

	it('should match "tomorow" → "tomorrow" (en)', () => {
		expect(fuzzyMatchDateKeyword('tomorow', 'en')).toBe('tomorrow');
	});

	it('should match "wedensday" → "wednesday" (en)', () => {
		expect(fuzzyMatchDateKeyword('wedensday', 'en')).toBe('wednesday');
	});

	it('should not match completely wrong words', () => {
		expect(fuzzyMatchDateKeyword('hallo', 'de')).toBeUndefined();
	});

	it('should extract date from fuzzy input "morge"', () => {
		const result = extractDate('Meeting morge', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.toDateString()).toBe(addDays(new Date(), 1).toDateString());
	});

	it('should extract date from fuzzy input "donerstag"', () => {
		const result = extractDate('Termin donerstag', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.getDay()).toBe(4); // Thursday
	});
});

// ============================================================================
// Date Range
// ============================================================================

describe('Date range', () => {
	it('should parse "15.-17. März" (de)', () => {
		const result = extractDateRange('Urlaub 15.-17. März', 'de');
		expect(result.value).toBeDefined();
		expect(result.value!.start.getDate()).toBe(15);
		expect(result.value!.end.getDate()).toBe(17);
		expect(result.value!.start.getMonth()).toBe(2); // March
	});

	it('should parse "3-5 May" (en)', () => {
		const result = extractDateRange('Holiday 3-5 May', 'en');
		expect(result.value).toBeDefined();
		expect(result.value!.start.getDate()).toBe(3);
		expect(result.value!.end.getDate()).toBe(5);
		expect(result.value!.start.getMonth()).toBe(4); // May
	});

	it('should return undefined for no range', () => {
		const result = extractDateRange('Normal text', 'de');
		expect(result.value).toBeUndefined();
	});
});

// ============================================================================
// Confidence Score
// ============================================================================

describe('Confidence score', () => {
	it('should return 1.0 for input with clear extractions', () => {
		const result = parseBaseInput('Meeting morgen 14 Uhr #wichtig', 'de');
		expect(result.confidence).toBe(1.0);
	});

	it('should return 0.5 for plain text with no extractions', () => {
		const result = parseBaseInput('Einfacher Text', 'de');
		expect(result.confidence).toBe(0.5);
	});
});

// ============================================================================
// Compose Helper
// ============================================================================

describe('createAppParser', () => {
	it('should compose base + custom extractions', () => {
		const { parse } = createAppParser('de', [
			{
				name: 'priority',
				extract: (text: string) => {
					if (/!!!/.test(text)) {
						return { value: 'urgent', remaining: text.replace(/!!!/, '').trim() };
					}
					return { value: undefined, remaining: text };
				},
			},
		]);

		const result = parse('Task morgen !!! #arbeit');
		expect(result.extractions.priority).toBe('urgent');
		expect(result.base.date).toBeDefined();
		expect(result.base.tagNames).toEqual(['arbeit']);
		expect(result.base.title).toBe('Task');
	});

	it('should work with no custom steps', () => {
		const { parse } = createAppParser('en', []);
		const result = parse('Meeting tomorrow 14:00');
		expect(result.base.date).toBeDefined();
		expect(result.base.time).toEqual({ hours: 14, minutes: 0 });
	});
});

// ============================================================================
// Default locale (backward compat)
// ============================================================================

describe('Default locale (de)', () => {
	it('extractDate defaults to de', () => {
		const result = extractDate('heute');
		expect(result.value).toBeDefined();
	});

	it('extractTime defaults to de', () => {
		const result = extractTime('14 Uhr');
		expect(result.value).toEqual({ hours: 14, minutes: 0 });
	});

	it('parseBaseInput defaults to de', () => {
		const result = parseBaseInput('Meeting morgen 14 Uhr #wichtig');
		expect(result.date).toBeDefined();
		expect(result.time).toEqual({ hours: 14, minutes: 0 });
		expect(result.tagNames).toEqual(['wichtig']);
	});

	it('formatDatePreview defaults to de', () => {
		expect(formatDatePreview(new Date())).toBe('Heute');
	});
});
