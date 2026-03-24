/**
 * Base Natural Language Parser
 *
 * Shared parsing utilities for date, time, and tags across all apps.
 * App-specific parsers (task-parser, event-parser, contact-parser) extend this.
 *
 * Supports locales: de, en, fr, es, it
 */

import {
	addDays,
	addWeeks,
	addHours,
	addMinutes,
	nextMonday,
	nextTuesday,
	nextWednesday,
	nextThursday,
	nextFriday,
	nextSaturday,
	nextSunday,
	setHours,
	setMinutes,
	isBefore,
	startOfWeek,
} from 'date-fns';

export type ParserLocale = 'de' | 'en' | 'fr' | 'es' | 'it';

export interface BaseParsedInput {
	title: string;
	date?: Date;
	time?: { hours: number; minutes: number };
	tagNames: string[];
	rawInput: string;
	/** Confidence score 0-1. 1.0 = exact match, 0.8 = fuzzy, 0.5 = ambiguous */
	confidence: number;
}

export interface ExtractResult<T> {
	value: T | undefined;
	remaining: string;
}

// ============================================================================
// Locale-aware Pattern Definitions
// ============================================================================

interface DatePattern {
	pattern: RegExp;
	getDate: (match?: RegExpMatchArray) => Date;
}

type DayFn = (date: Date) => Date;

const NEXT_DAY_FNS: DayFn[] = [
	nextMonday,
	nextTuesday,
	nextWednesday,
	nextThursday,
	nextFriday,
	nextSaturday,
	nextSunday,
];

// Weekday names per locale (Monday-Sunday order)
const WEEKDAY_NAMES: Record<ParserLocale, string[]> = {
	de: ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'],
	en: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
	fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
	es: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
	it: ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica'],
};

// Relative date keywords per locale
interface RelativeDateWords {
	today: string[];
	tomorrow: string[];
	dayAfterTomorrow: string[];
	yesterday: string[];
	dayBeforeYesterday: string[];
	nextWeek: RegExp;
	weekAfterNext: RegExp;
	nextPrefix: RegExp;
	thisPrefix: RegExp;
}

const RELATIVE_DATE_WORDS: Record<ParserLocale, RelativeDateWords> = {
	de: {
		today: ['heute'],
		tomorrow: ['morgen'],
		dayAfterTomorrow: ['übermorgen'],
		yesterday: ['gestern'],
		dayBeforeYesterday: ['vorgestern'],
		nextWeek: /(?<!\p{L})nächste[nr]?\s*woche(?!\p{L})/iu,
		weekAfterNext: /(?<!\p{L})über\s*nächste[nr]?\s*woche(?!\p{L})/iu,
		nextPrefix: /(?<!\p{L})nächste[nr]?\s*/iu,
		thisPrefix: /\bdiese[nr]?\s*/i,
	},
	en: {
		today: ['today'],
		tomorrow: ['tomorrow'],
		dayAfterTomorrow: [],
		yesterday: ['yesterday'],
		dayBeforeYesterday: [],
		nextWeek: /\bnext\s*week\b/i,
		weekAfterNext: /\bweek\s*after\s*next\b/i,
		nextPrefix: /\bnext\s*/i,
		thisPrefix: /\bthis\s*/i,
	},
	fr: {
		today: ["aujourd'hui", 'aujourdhui'],
		tomorrow: ['demain'],
		dayAfterTomorrow: ['après-demain', 'apres-demain'],
		yesterday: ['hier'],
		dayBeforeYesterday: ['avant-hier'],
		nextWeek: /\bsemaine\s*prochaine\b/i,
		weekAfterNext: /\bsemaine\s*d'?après\b/i,
		nextPrefix: /\bprochain[e]?\s*/i,
		thisPrefix: /\bce(?:tte?)?\s*/i,
	},
	es: {
		today: ['hoy'],
		tomorrow: ['mañana', 'manana'],
		dayAfterTomorrow: ['pasado\\s*mañana', 'pasado\\s*manana'],
		yesterday: ['ayer'],
		dayBeforeYesterday: ['anteayer'],
		nextWeek: /(?<!\p{L})próxima\s*semana(?!\p{L})/iu,
		weekAfterNext: /(?<!\p{L})semana\s*después(?!\p{L})/iu,
		nextPrefix: /(?<!\p{L})próxim[oa]\s*/iu,
		thisPrefix: /\best[ea]\s*/i,
	},
	it: {
		today: ['oggi'],
		tomorrow: ['domani'],
		dayAfterTomorrow: ['dopodomani'],
		yesterday: ['ieri'],
		dayBeforeYesterday: ["l'?altro\\s*ieri", 'avantieri'],
		nextWeek: /\bprossima\s*settimana\b/i,
		weekAfterNext: /\bsettimana\s*dopo\b/i,
		nextPrefix: /\bprossim[oa]\s*/i,
		thisPrefix: /\bquest[oa]\s*/i,
	},
};

// "in X days" and "in X weeks" patterns per locale
const IN_DAYS_PATTERNS: Record<ParserLocale, RegExp> = {
	de: /\bin\s*(\d+)\s*tage?n?\b/i,
	en: /\bin\s*(\d+)\s*days?\b/i,
	fr: /\bdans\s*(\d+)\s*jours?\b/i,
	es: /\ben\s*(\d+)\s*d[ií]as?\b/i,
	it: /\btra\s*(\d+)\s*giorni?\b/i,
};

const IN_WEEKS_PATTERNS: Record<ParserLocale, RegExp> = {
	de: /\bin\s*(\d+)\s*wochen?\b/i,
	en: /\bin\s*(\d+)\s*weeks?\b/i,
	fr: /\bdans\s*(\d+)\s*semaines?\b/i,
	es: /\ben\s*(\d+)\s*semanas?\b/i,
	it: /\btra\s*(\d+)\s*settimane?\b/i,
};

// Month names per locale (January=0)
const MONTH_NAMES: Record<ParserLocale, string[]> = {
	de: [
		'januar',
		'februar',
		'märz',
		'april',
		'mai',
		'juni',
		'juli',
		'august',
		'september',
		'oktober',
		'november',
		'dezember',
	],
	en: [
		'january',
		'february',
		'march',
		'april',
		'may',
		'june',
		'july',
		'august',
		'september',
		'october',
		'november',
		'december',
	],
	fr: [
		'janvier',
		'février',
		'mars',
		'avril',
		'mai',
		'juin',
		'juillet',
		'août',
		'septembre',
		'octobre',
		'novembre',
		'décembre',
	],
	es: [
		'enero',
		'febrero',
		'marzo',
		'abril',
		'mayo',
		'junio',
		'julio',
		'agosto',
		'septiembre',
		'octubre',
		'noviembre',
		'diciembre',
	],
	it: [
		'gennaio',
		'febbraio',
		'marzo',
		'aprile',
		'maggio',
		'giugno',
		'luglio',
		'agosto',
		'settembre',
		'ottobre',
		'novembre',
		'dicembre',
	],
};

// Short month names (3 chars)
const SHORT_MONTH_NAMES: Record<ParserLocale, string[]> = {
	de: ['jan', 'feb', 'mär', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dez'],
	en: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
	fr: ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'],
	es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
	it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
};

// Time patterns per locale
const TIME_PATTERNS: Record<ParserLocale, RegExp> = {
	de: /\b(?:um\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:uhr)?\b/i,
	en: /\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:o'?clock|am|pm)?\b/i,
	fr: /\b(?:à\s*)?(\d{1,2})(?:[h:](\d{2}))?\s*(?:heures?)?\b/i,
	es: /\b(?:a\s*las?\s*)?(\d{1,2})(?::(\d{2}))?\s*(?:horas?)?\b/i,
	it: /\b(?:alle?\s*)?(\d{1,2})(?::(\d{2}))?\b/i,
};

// Preview formatting words
const PREVIEW_WORDS: Record<ParserLocale, { today: string; tomorrow: string; locale: string }> = {
	de: { today: 'Heute', tomorrow: 'Morgen', locale: 'de-DE' },
	en: { today: 'Today', tomorrow: 'Tomorrow', locale: 'en-US' },
	fr: { today: "Aujourd'hui", tomorrow: 'Demain', locale: 'fr-FR' },
	es: { today: 'Hoy', tomorrow: 'Mañana', locale: 'es-ES' },
	it: { today: 'Oggi', tomorrow: 'Domani', locale: 'it-IT' },
};

// ============================================================================
// Fuzzy Matching Utilities
// ============================================================================

/**
 * Simple Levenshtein distance (for short words only)
 */
function levenshtein(a: string, b: string): number {
	const m = a.length;
	const n = b.length;
	const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

	for (let i = 0; i <= m; i++) dp[i][0] = i;
	for (let j = 0; j <= n; j++) dp[0][j] = j;

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			dp[i][j] = Math.min(
				dp[i - 1][j] + 1,
				dp[i][j - 1] + 1,
				dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
			);
		}
	}
	return dp[m][n];
}

// Keywords that should support fuzzy matching (max distance 1-2 depending on length)
const FUZZY_DATE_WORDS: Record<ParserLocale, string[]> = {
	de: [
		'heute',
		'morgen',
		'übermorgen',
		'montag',
		'dienstag',
		'mittwoch',
		'donnerstag',
		'freitag',
		'samstag',
		'sonntag',
	],
	en: [
		'today',
		'tomorrow',
		'monday',
		'tuesday',
		'wednesday',
		'thursday',
		'friday',
		'saturday',
		'sunday',
	],
	fr: ['demain', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
	es: ['hoy', 'lunes', 'martes', 'jueves', 'viernes'],
	it: ['oggi', 'domani'],
};

/**
 * Try fuzzy matching a word against known date keywords.
 * Returns the canonical keyword if a close match is found, undefined otherwise.
 * Max distance: 1 for words <= 5 chars, 2 for longer words.
 */
export function fuzzyMatchDateKeyword(
	word: string,
	locale: ParserLocale = 'de'
): string | undefined {
	const keywords = FUZZY_DATE_WORDS[locale];
	if (!keywords) return undefined;

	const lower = word.toLowerCase();
	const maxDist = lower.length <= 5 ? 1 : 2;

	let bestMatch: string | undefined;
	let bestDist = Infinity;

	for (const keyword of keywords) {
		// Skip if length difference is too large
		if (Math.abs(lower.length - keyword.length) > maxDist) continue;

		const dist = levenshtein(lower, keyword);
		if (dist <= maxDist && dist < bestDist) {
			bestDist = dist;
			bestMatch = keyword;
		}
	}

	return bestMatch;
}

// ============================================================================
// Pattern Builder
// ============================================================================

// Word boundary that works with accented characters (lunedì, mañana, etc.)
// Standard \b doesn't treat accented chars as word chars.
// We use Unicode-aware regex with lookbehind/lookahead.
function wb(word: string): string {
	// Use negative lookbehind/lookahead for word-like chars including accented ones
	return `(?<![\\p{L}\\p{N}])${word}(?![\\p{L}\\p{N}])`;
}

function buildDatePatterns(locale: ParserLocale): DatePattern[] {
	const words = RELATIVE_DATE_WORDS[locale];
	const weekdays = WEEKDAY_NAMES[locale];
	const patterns: DatePattern[] = [];

	// Today
	for (const word of words.today) {
		patterns.push({ pattern: new RegExp(wb(word), 'iu'), getDate: () => new Date() });
	}

	// Tomorrow
	for (const word of words.tomorrow) {
		patterns.push({
			pattern: new RegExp(wb(word), 'iu'),
			getDate: () => addDays(new Date(), 1),
		});
	}

	// Day after tomorrow
	for (const word of words.dayAfterTomorrow) {
		patterns.push({
			pattern: new RegExp(wb(word), 'iu'),
			getDate: () => addDays(new Date(), 2),
		});
	}

	// Yesterday
	for (const word of words.yesterday) {
		patterns.push({
			pattern: new RegExp(wb(word), 'iu'),
			getDate: () => addDays(new Date(), -1),
		});
	}

	// Day before yesterday
	for (const word of words.dayBeforeYesterday) {
		patterns.push({
			pattern: new RegExp(wb(word), 'iu'),
			getDate: () => addDays(new Date(), -2),
		});
	}

	// Week after next (must come before "next week")
	patterns.push({ pattern: words.weekAfterNext, getDate: () => addDays(new Date(), 14) });

	// Next week
	patterns.push({ pattern: words.nextWeek, getDate: () => addDays(new Date(), 7) });

	// "this <weekday>" patterns - gets the day in the current week
	// If already past, still returns this week's day (for logging retroactively)
	for (let i = 0; i < weekdays.length; i++) {
		const day = weekdays[i];
		const targetDayOfWeek = [1, 2, 3, 4, 5, 6, 0][i]; // Mon=1..Sun=0

		patterns.push({
			pattern: new RegExp(`${words.thisPrefix.source}${day}(?![\\p{L}\\p{N}])`, 'iu'),
			getDate: () => {
				const now = new Date();
				const currentDay = now.getDay();
				if (currentDay === targetDayOfWeek) return now;
				// If the target day is earlier in the week, use previous, otherwise next
				const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
				const diff = targetDayOfWeek === 0 ? 6 : targetDayOfWeek - 1; // days from Monday
				return addDays(thisWeekStart, diff);
			},
		});
	}

	// "next <weekday>" patterns
	for (let i = 0; i < weekdays.length; i++) {
		const dayFn = NEXT_DAY_FNS[i];
		const day = weekdays[i];
		patterns.push({
			pattern: new RegExp(`${words.nextPrefix.source}${day}(?![\\p{L}\\p{N}])`, 'iu'),
			getDate: () => dayFn(new Date()),
		});
	}

	// Plain weekday names (implies "next")
	for (let i = 0; i < weekdays.length; i++) {
		const dayFn = NEXT_DAY_FNS[i];
		const day = weekdays[i];
		patterns.push({
			pattern: new RegExp(wb(day), 'iu'),
			getDate: () => dayFn(new Date()),
		});
	}

	// Month names: "im März", "in January", "en février"
	const months = MONTH_NAMES[locale];
	const monthPrepositions: Record<ParserLocale, string> = {
		de: '(?:im|in)\\s+',
		en: '(?:in)\\s+',
		fr: '(?:en)\\s+',
		es: '(?:en)\\s+',
		it: '(?:in|a)\\s+',
	};

	for (let i = 0; i < months.length; i++) {
		const monthIndex = i;
		const monthName = months[i];
		// "im März" / "in January"
		patterns.push({
			pattern: new RegExp(`\\b${monthPrepositions[locale]}${monthName}\\b`, 'iu'),
			getDate: () => {
				const now = new Date();
				let year = now.getFullYear();
				// If month already passed, use next year
				if (monthIndex < now.getMonth()) year++;
				return new Date(year, monthIndex, 1);
			},
		});
	}

	return patterns;
}

// Cache built patterns per locale
const datePatternCache = new Map<ParserLocale, DatePattern[]>();

function getDatePatterns(locale: ParserLocale): DatePattern[] {
	let patterns = datePatternCache.get(locale);
	if (!patterns) {
		patterns = buildDatePatterns(locale);
		datePatternCache.set(locale, patterns);
	}
	return patterns;
}

// ============================================================================
// Specific date pattern (DD.MM. or DD.MM.YYYY or MM/DD/YYYY)
// ============================================================================

// DD.MM. or DD.MM.YYYY (European)
const EU_DATE_PATTERN = /\b(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?\b/;
// MM/DD/YYYY or MM/DD (US)
const US_DATE_PATTERN = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/;

function getSpecificDatePattern(locale: ParserLocale): {
	pattern: RegExp;
	parse: (match: RegExpMatchArray) => Date;
} {
	if (locale === 'en') {
		return {
			pattern: US_DATE_PATTERN,
			parse: (match) => {
				const month = parseInt(match[1], 10) - 1;
				const day = parseInt(match[2], 10);
				const year = match[3]
					? parseInt(match[3], 10) < 100
						? 2000 + parseInt(match[3], 10)
						: parseInt(match[3], 10)
					: new Date().getFullYear();
				return new Date(year, month, day);
			},
		};
	}
	// European format (DE, FR, ES, IT)
	return {
		pattern: EU_DATE_PATTERN,
		parse: (match) => {
			const day = parseInt(match[1], 10);
			const month = parseInt(match[2], 10) - 1;
			const year = match[3]
				? parseInt(match[3], 10) < 100
					? 2000 + parseInt(match[3], 10)
					: parseInt(match[3], 10)
				: new Date().getFullYear();
			return new Date(year, month, day);
		},
	};
}

// ============================================================================
// Date Extraction
// ============================================================================

/**
 * Extract date from text
 */
export function extractDate(text: string, locale: ParserLocale = 'de'): ExtractResult<Date> {
	let remaining = text;

	// Try "in X weeks" pattern first (before "in X days" to avoid partial match)
	const inWeeksPattern = IN_WEEKS_PATTERNS[locale];
	const inWeeksMatch = remaining.match(inWeeksPattern);
	if (inWeeksMatch) {
		const weeks = parseInt(inWeeksMatch[1], 10);
		const date = addWeeks(new Date(), weeks);
		remaining = remaining.replace(inWeeksPattern, '').trim();
		return { value: date, remaining };
	}

	// Try "in X days" pattern
	const inDaysPattern = IN_DAYS_PATTERNS[locale];
	const inDaysMatch = remaining.match(inDaysPattern);
	if (inDaysMatch) {
		const days = parseInt(inDaysMatch[1], 10);
		const date = addDays(new Date(), days);
		remaining = remaining.replace(inDaysPattern, '').trim();
		return { value: date, remaining };
	}

	// Try ordinal + month: "5. März", "3rd of May", "le 5 mars"
	const months = MONTH_NAMES[locale];
	const shortMonthsList = SHORT_MONTH_NAMES[locale];
	const allMonths = [...months, ...shortMonthsList];
	const monthPattern = allMonths.join('|');

	// Ordinal patterns per locale
	const ordinalPatterns: Record<ParserLocale, RegExp> = {
		de: new RegExp(`\\b(\\d{1,2})\\.\\s*(${monthPattern})\\b`, 'iu'),
		en: new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern})\\b`, 'iu'),
		fr: new RegExp(`\\b(?:le\\s+)?(\\d{1,2})(?:er|e|ème)?\\s+(${monthPattern})\\b`, 'iu'),
		es: new RegExp(`\\b(?:el\\s+)?(\\d{1,2})\\s+(?:de\\s+)?(${monthPattern})\\b`, 'iu'),
		it: new RegExp(`\\b(?:il\\s+)?(\\d{1,2})\\s+(${monthPattern})\\b`, 'iu'),
	};

	const ordinalMatch = remaining.match(ordinalPatterns[locale]);
	if (ordinalMatch) {
		const day = parseInt(ordinalMatch[1], 10);
		const monthStr = ordinalMatch[2].toLowerCase();
		let monthIndex = months.findIndex((m) => m.toLowerCase() === monthStr);
		if (monthIndex === -1) {
			monthIndex = shortMonthsList.findIndex((m) => m.toLowerCase() === monthStr);
		}
		if (monthIndex >= 0 && day >= 1 && day <= 31) {
			const now = new Date();
			let year = now.getFullYear();
			const candidate = new Date(year, monthIndex, day);
			if (isBefore(candidate, now)) year++;
			remaining = remaining.replace(ordinalPatterns[locale], '').trim();
			return { value: new Date(year, monthIndex, day), remaining };
		}
	}

	// Try specific date (DD.MM. or MM/DD)
	const { pattern: specificPattern, parse: parseSpecific } = getSpecificDatePattern(locale);
	const specificDateMatch = remaining.match(specificPattern);
	if (specificDateMatch) {
		const date = parseSpecific(specificDateMatch);
		remaining = remaining.replace(specificPattern, '').trim();
		return { value: date, remaining };
	}

	// Try relative date patterns (exact match)
	const patterns = getDatePatterns(locale);
	for (const { pattern, getDate } of patterns) {
		if (pattern.test(remaining)) {
			const date = getDate();
			remaining = remaining.replace(pattern, '').trim();
			return { value: date, remaining };
		}
	}

	// Fuzzy match: try each word against known date keywords
	const words = remaining.split(/\s+/);
	for (const word of words) {
		if (word.length < 3) continue; // Skip very short words
		const matched = fuzzyMatchDateKeyword(word, locale);
		if (matched) {
			// Re-run extraction with the corrected keyword
			const corrected = remaining.replace(
				new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
				matched
			);
			const retryResult = extractDate(corrected, locale);
			if (retryResult.value) {
				return retryResult;
			}
		}
	}

	return { value: undefined, remaining };
}

// ============================================================================
// Date Range Extraction
// ============================================================================

export interface DateRange {
	start: Date;
	end: Date;
}

// "15.-17. März", "15-17 March", "Mon-Fri"
const EU_DATE_RANGE_PATTERN = /\b(\d{1,2})\.\s*[-–]\s*(\d{1,2})\.\s*(\d{1,2})?\.\s*/;

/**
 * Extract a date range (e.g., "15.-17.3.", "15.-17. März")
 */
export function extractDateRange(
	text: string,
	locale: ParserLocale = 'de'
): ExtractResult<DateRange> {
	// Try "DD.-DD.MM." or "DD.-DD. MonthName"
	const months = MONTH_NAMES[locale];
	const monthPattern = months.join('|');

	// "15.-17. März" / "15-17 March"
	const withMonthName = new RegExp(
		`\\b(\\d{1,2})\\.?\\s*[-–]\\s*(\\d{1,2})\\.?\\s+(${monthPattern})\\b`,
		'iu'
	);
	const match = text.match(withMonthName);
	if (match) {
		const startDay = parseInt(match[1]);
		const endDay = parseInt(match[2]);
		const monthStr = match[3].toLowerCase();
		const monthIndex = months.findIndex((m) => m.toLowerCase() === monthStr);
		if (monthIndex >= 0 && startDay >= 1 && endDay >= 1) {
			const year = new Date().getFullYear();
			return {
				value: {
					start: new Date(year, monthIndex, startDay),
					end: new Date(year, monthIndex, endDay),
				},
				remaining: text.replace(withMonthName, '').trim(),
			};
		}
	}

	// "15.-17.3." (EU numeric format)
	const euMatch = text.match(EU_DATE_RANGE_PATTERN);
	if (euMatch && euMatch[3]) {
		const startDay = parseInt(euMatch[1]);
		const endDay = parseInt(euMatch[2]);
		const month = parseInt(euMatch[3]) - 1;
		const year = new Date().getFullYear();
		if (startDay >= 1 && endDay >= 1 && month >= 0 && month <= 11) {
			return {
				value: {
					start: new Date(year, month, startDay),
					end: new Date(year, month, endDay),
				},
				remaining: text.replace(EU_DATE_RANGE_PATTERN, '').trim(),
			};
		}
	}

	return { value: undefined, remaining: text };
}

// ============================================================================
// Relative Time Extraction ("in 2 Stunden", "in 30 Minuten")
// ============================================================================

interface RelativeTimePattern {
	pattern: RegExp;
	getDate: (match: RegExpMatchArray) => Date;
}

const RELATIVE_TIME_PATTERNS: Record<ParserLocale, RelativeTimePattern[]> = {
	de: [
		{ pattern: /\bin\s+einer?\s+halben\s+stunde\b/i, getDate: () => addMinutes(new Date(), 30) },
		{
			pattern: /\bin\s+(\d+)\s+stunde[n]?\b/i,
			getDate: (m) => addHours(new Date(), parseInt(m[1])),
		},
		{
			pattern: /\bin\s+(\d+)\s+minute[n]?\b/i,
			getDate: (m) => addMinutes(new Date(), parseInt(m[1])),
		},
	],
	en: [
		{ pattern: /\bin\s+half\s+an?\s+hour\b/i, getDate: () => addMinutes(new Date(), 30) },
		{
			pattern: /\bin\s+(\d+)\s+hours?\b/i,
			getDate: (m) => addHours(new Date(), parseInt(m[1])),
		},
		{
			pattern: /\bin\s+(\d+)\s+minutes?\b/i,
			getDate: (m) => addMinutes(new Date(), parseInt(m[1])),
		},
	],
	fr: [
		{ pattern: /\bdans\s+une?\s+demi[e]?\s+heure\b/i, getDate: () => addMinutes(new Date(), 30) },
		{
			pattern: /\bdans\s+(\d+)\s+heures?\b/i,
			getDate: (m) => addHours(new Date(), parseInt(m[1])),
		},
		{
			pattern: /\bdans\s+(\d+)\s+minutes?\b/i,
			getDate: (m) => addMinutes(new Date(), parseInt(m[1])),
		},
	],
	es: [
		{ pattern: /\ben\s+media\s+hora\b/i, getDate: () => addMinutes(new Date(), 30) },
		{
			pattern: /\ben\s+(\d+)\s+horas?\b/i,
			getDate: (m) => addHours(new Date(), parseInt(m[1])),
		},
		{
			pattern: /\ben\s+(\d+)\s+minutos?\b/i,
			getDate: (m) => addMinutes(new Date(), parseInt(m[1])),
		},
	],
	it: [
		{ pattern: /\btra\s+mezz'?ora\b/i, getDate: () => addMinutes(new Date(), 30) },
		{
			pattern: /\btra\s+(\d+)\s+or[ea]\b/i,
			getDate: (m) => addHours(new Date(), parseInt(m[1])),
		},
		{
			pattern: /\btra\s+(\d+)\s+minut[io]\b/i,
			getDate: (m) => addMinutes(new Date(), parseInt(m[1])),
		},
	],
};

/**
 * Extract relative time expressions ("in 2 hours", "in 30 minutes")
 * Returns a full Date since relative time implies date + time
 */
export function extractRelativeTime(
	text: string,
	locale: ParserLocale = 'de'
): ExtractResult<Date> {
	const patterns = RELATIVE_TIME_PATTERNS[locale];
	for (const { pattern, getDate } of patterns) {
		const match = text.match(pattern);
		if (match) {
			return {
				value: getDate(match),
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { value: undefined, remaining: text };
}

// ============================================================================
// Time Extraction
// ============================================================================

/**
 * Extract time from text
 */
export function extractTime(
	text: string,
	locale: ParserLocale = 'de'
): ExtractResult<{ hours: number; minutes: number }> {
	const timePattern = TIME_PATTERNS[locale];
	const match = text.match(timePattern);

	if (match) {
		let hours = parseInt(match[1], 10);
		const minutes = match[2] ? parseInt(match[2], 10) : 0;

		// Handle AM/PM for English
		if (locale === 'en') {
			const fullMatch = match[0].toLowerCase();
			if (fullMatch.includes('pm') && hours < 12) hours += 12;
			if (fullMatch.includes('am') && hours === 12) hours = 0;
		}

		// Validate time
		if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
			const remaining = text.replace(timePattern, '').trim();
			return { value: { hours, minutes }, remaining };
		}
	}

	return { value: undefined, remaining: text };
}

// ============================================================================
// Timezone Extraction
// ============================================================================

// Common timezone abbreviations mapped to IANA timezone identifiers
const TIMEZONE_MAP: Record<string, string> = {
	// European
	CET: 'Europe/Berlin',
	CEST: 'Europe/Berlin',
	MET: 'Europe/Berlin',
	MEST: 'Europe/Berlin',
	WET: 'Europe/London',
	WEST: 'Europe/London',
	EET: 'Europe/Athens',
	EEST: 'Europe/Athens',
	GMT: 'Europe/London',
	// US
	EST: 'America/New_York',
	EDT: 'America/New_York',
	CST: 'America/Chicago',
	CDT: 'America/Chicago',
	MST: 'America/Denver',
	MDT: 'America/Denver',
	PST: 'America/Los_Angeles',
	PDT: 'America/Los_Angeles',
	// Asia/Pacific
	JST: 'Asia/Tokyo',
	KST: 'Asia/Seoul',
	IST: 'Asia/Kolkata',
	AEST: 'Australia/Sydney',
	// Universal
	UTC: 'UTC',
};

const TIMEZONE_ABBREVS = Object.keys(TIMEZONE_MAP).join('|');
const TIMEZONE_PATTERN = new RegExp(`\\b(${TIMEZONE_ABBREVS})\\b`);

/**
 * Extract timezone abbreviation from text
 * Returns the IANA timezone identifier
 */
export function extractTimezone(text: string): ExtractResult<string> {
	const match = text.match(TIMEZONE_PATTERN);
	if (match) {
		const tz = TIMEZONE_MAP[match[1].toUpperCase()];
		if (tz) {
			return {
				value: tz,
				remaining: text.replace(TIMEZONE_PATTERN, '').trim(),
			};
		}
	}
	return { value: undefined, remaining: text };
}

// ============================================================================
// Tag Extraction
// ============================================================================

/**
 * Extract tags (#tag1 #tag2) from text
 */
export function extractTags(text: string): ExtractResult<string[]> {
	const tags: string[] = [];
	const tagRegex = /#(\S+)/g;
	let match;

	while ((match = tagRegex.exec(text)) !== null) {
		tags.push(match[1]);
	}

	const remaining = text.replace(/#\S+/g, '').trim();
	return { value: tags, remaining };
}

// ============================================================================
// @ Reference Extraction (Projects, Calendars, Companies)
// ============================================================================

/**
 * Extract @reference from text (single)
 */
export function extractAtReference(text: string): ExtractResult<string> {
	const match = text.match(/@(\S+)/);

	if (match) {
		const remaining = text.replace(/@\S+/, '').trim();
		return { value: match[1], remaining };
	}

	return { value: undefined, remaining: text };
}

/**
 * Extract all @references from text
 */
export function extractAtReferences(text: string): ExtractResult<string[]> {
	const refs: string[] = [];
	const refRegex = /@(\S+)/g;
	let match;

	while ((match = refRegex.exec(text)) !== null) {
		refs.push(match[1]);
	}

	const remaining = text.replace(/@\S+/g, '').trim();
	return { value: refs.length > 0 ? refs : undefined, remaining };
}

// ============================================================================
// Combined Date + Time
// ============================================================================

/**
 * Combine date and time into a single Date object
 */
export function combineDateAndTime(
	date?: Date,
	time?: { hours: number; minutes: number }
): Date | undefined {
	if (!date) return undefined;

	if (time) {
		return setHours(setMinutes(date, time.minutes), time.hours);
	}

	return date;
}

// ============================================================================
// Preview Formatting
// ============================================================================

/**
 * Format date for preview display
 */
export function formatDatePreview(date: Date, locale: ParserLocale = 'de'): string {
	const now = new Date();
	const tomorrow = addDays(now, 1);
	const words = PREVIEW_WORDS[locale];

	if (date.toDateString() === now.toDateString()) {
		return words.today;
	}
	if (date.toDateString() === tomorrow.toDateString()) {
		return words.tomorrow;
	}

	return date.toLocaleDateString(words.locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
	});
}

/**
 * Format time for preview display
 */
export function formatTimePreview(time: { hours: number; minutes: number }): string {
	return `${time.hours.toString().padStart(2, '0')}:${time.minutes.toString().padStart(2, '0')}`;
}

/**
 * Format date and time for preview
 */
export function formatDateTimePreview(
	date?: Date,
	time?: { hours: number; minutes: number },
	locale: ParserLocale = 'de'
): string {
	if (!date) return '';

	let result = formatDatePreview(date, locale);

	if (time) {
		result += ` ${formatTimePreview(time)}`;
	}

	return result;
}

// ============================================================================
// Recurrence Extraction
// ============================================================================

interface RecurrencePattern {
	pattern: RegExp;
	rrule: string;
}

const RECURRENCE_PATTERNS: Record<ParserLocale, RecurrencePattern[]> = {
	de: [
		{ pattern: /\bjeden\s+tag\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\btäglich\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bjede\s+woche\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bwöchentlich\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bjeden\s+monat\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bmonatlich\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bjedes\s+jahr\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bjährlich\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bjeden\s+montag\b/i, rrule: 'FREQ=WEEKLY;BYDAY=MO' },
		{ pattern: /\bjeden\s+dienstag\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TU' },
		{ pattern: /\bjeden\s+mittwoch\b/i, rrule: 'FREQ=WEEKLY;BYDAY=WE' },
		{ pattern: /\bjeden\s+donnerstag\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TH' },
		{ pattern: /\bjeden\s+freitag\b/i, rrule: 'FREQ=WEEKLY;BYDAY=FR' },
		{ pattern: /\bjeden\s+samstag\b/i, rrule: 'FREQ=WEEKLY;BYDAY=SA' },
		{ pattern: /\bjeden\s+sonntag\b/i, rrule: 'FREQ=WEEKLY;BYDAY=SU' },
		{ pattern: /\balle\s+(\d+)\s+tage\b/i, rrule: 'FREQ=DAILY;INTERVAL=$1' },
		{ pattern: /\balle\s+(\d+)\s+wochen\b/i, rrule: 'FREQ=WEEKLY;INTERVAL=$1' },
	],
	en: [
		{ pattern: /\bevery\s+day\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bdaily\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bevery\s+week\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bweekly\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bevery\s+month\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bmonthly\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bevery\s+year\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\byearly\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bevery\s+monday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=MO' },
		{ pattern: /\bevery\s+tuesday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TU' },
		{ pattern: /\bevery\s+wednesday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=WE' },
		{ pattern: /\bevery\s+thursday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TH' },
		{ pattern: /\bevery\s+friday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=FR' },
		{ pattern: /\bevery\s+saturday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=SA' },
		{ pattern: /\bevery\s+sunday\b/i, rrule: 'FREQ=WEEKLY;BYDAY=SU' },
		{ pattern: /\bevery\s+(\d+)\s+days\b/i, rrule: 'FREQ=DAILY;INTERVAL=$1' },
		{ pattern: /\bevery\s+(\d+)\s+weeks\b/i, rrule: 'FREQ=WEEKLY;INTERVAL=$1' },
	],
	fr: [
		{ pattern: /\btous\s+les\s+jours\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bquotidien\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bchaque\s+semaine\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bhebdomadaire\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bchaque\s+mois\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bmensuel\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bchaque\s+année\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bannuel\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bchaque\s+lundi\b/i, rrule: 'FREQ=WEEKLY;BYDAY=MO' },
		{ pattern: /\bchaque\s+mardi\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TU' },
		{ pattern: /\bchaque\s+mercredi\b/i, rrule: 'FREQ=WEEKLY;BYDAY=WE' },
		{ pattern: /\bchaque\s+jeudi\b/i, rrule: 'FREQ=WEEKLY;BYDAY=TH' },
		{ pattern: /\bchaque\s+vendredi\b/i, rrule: 'FREQ=WEEKLY;BYDAY=FR' },
	],
	es: [
		{ pattern: /\btodos\s+los\s+d[ií]as\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bdiario\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bcada\s+semana\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bsemanal\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bcada\s+mes\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bmensual\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bcada\s+año\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\banual\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bcada\s+lunes\b/i, rrule: 'FREQ=WEEKLY;BYDAY=MO' },
	],
	it: [
		{ pattern: /\bogni\s+giorno\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bgiornaliero\b/i, rrule: 'FREQ=DAILY' },
		{ pattern: /\bogni\s+settimana\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bsettimanale\b/i, rrule: 'FREQ=WEEKLY' },
		{ pattern: /\bogni\s+mese\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bmensile\b/i, rrule: 'FREQ=MONTHLY' },
		{ pattern: /\bogni\s+anno\b/i, rrule: 'FREQ=YEARLY' },
		{ pattern: /\bannuale\b/i, rrule: 'FREQ=YEARLY' },
	],
};

/**
 * Extract recurrence rule from text, returns RFC 5545 RRULE string
 */
export function extractRecurrence(
	text: string,
	locale: ParserLocale = 'de'
): ExtractResult<string> {
	const patterns = RECURRENCE_PATTERNS[locale];
	for (const { pattern, rrule } of patterns) {
		const match = text.match(pattern);
		if (match) {
			// Replace $1 with captured group if present
			const resolvedRrule = match[1] ? rrule.replace('$1', match[1]) : rrule;
			const remaining = text.replace(pattern, '').trim();
			return { value: resolvedRrule, remaining };
		}
	}
	return { value: undefined, remaining: text };
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse base input - extracts common patterns (date, time, tags, @reference)
 *
 * App-specific parsers should call this first, then extract their own patterns.
 */
export function parseBaseInput(input: string, locale: ParserLocale = 'de'): BaseParsedInput {
	let text = input.trim();
	const rawInput = text;

	// Extract tags first (they're clearly delimited)
	const tagsResult = extractTags(text);
	text = tagsResult.remaining;
	const tagNames = tagsResult.value || [];

	// Extract date
	const dateResult = extractDate(text, locale);
	text = dateResult.remaining;
	const date = dateResult.value;

	// Extract time
	const timeResult = extractTime(text, locale);
	text = timeResult.remaining;
	const time = timeResult.value;

	// If we got time but no date, assume today
	const finalDate = time && !date ? new Date() : date;

	// Clean up multiple spaces
	const title = text.replace(/\s+/g, ' ').trim();

	// Calculate confidence: how much was extracted vs raw input
	const hasExtractions = !!(finalDate || time || tagNames.length > 0);
	let confidence = 1.0;
	if (!hasExtractions && title === rawInput) {
		confidence = 0.5; // Nothing was extracted - ambiguous
	} else if (hasExtractions) {
		// Check if the remaining title still looks clean
		confidence = title.length > 0 ? 1.0 : 0.8;
	}

	return {
		title,
		date: finalDate,
		time,
		tagNames,
		rawInput,
		confidence,
	};
}

// ============================================================================
// Utility: Clean title from all patterns
// ============================================================================

/**
 * Remove all recognized patterns from text to get clean title
 */
export function cleanTitle(text: string, locale: ParserLocale = 'de'): string {
	let result = text;

	// Remove tags
	result = result.replace(/#\S+/g, '');

	// Remove @references
	result = result.replace(/@\S+/g, '');

	// Remove "in X days"
	result = result.replace(IN_DAYS_PATTERNS[locale], '');

	// Remove specific dates
	const { pattern: specificPattern } = getSpecificDatePattern(locale);
	result = result.replace(specificPattern, '');

	// Remove relative date patterns
	for (const { pattern } of getDatePatterns(locale)) {
		result = result.replace(pattern, '');
	}

	// Remove time
	result = result.replace(TIME_PATTERNS[locale], '');

	// Clean up
	return result.replace(/\s+/g, ' ').trim();
}

// ============================================================================
// Parser Compose Helper
// ============================================================================

/**
 * Extraction step definition for compose helper
 */
export interface ExtractionStep<T> {
	/** Name of this extraction (used as key in result) */
	name: string;
	/** Extract function: takes text, returns value and remaining text */
	extract: (text: string) => { value: T | undefined; remaining: string };
}

/**
 * Create an app-specific parser from a list of extraction steps.
 * Runs base parser first (date, time, tags), then custom steps.
 *
 * @example
 * ```ts
 * const { parse } = createAppParser('de', [
 *   { name: 'priority', extract: extractPriority },
 *   { name: 'project', extract: (t) => extractAtReference(t) },
 * ]);
 * const result = parse('Task morgen @Arbeit !!!');
 * // result.base = { title, date, time, tagNames, ... }
 * // result.extractions = { priority: 'urgent', project: 'Arbeit' }
 * ```
 */
export function createAppParser<T extends Record<string, unknown>>(
	locale: ParserLocale,
	steps: ExtractionStep<unknown>[]
): {
	parse: (input: string) => { base: BaseParsedInput; extractions: T };
} {
	return {
		parse(input: string) {
			let text = input.trim();
			const extractions: Record<string, unknown> = {};

			// Run custom extraction steps first (before base parser)
			for (const step of steps) {
				const result = step.extract(text);
				extractions[step.name] = result.value;
				text = result.remaining;
			}

			// Run base parser on remaining text
			const base = parseBaseInput(text, locale);

			return { base, extractions: extractions as T };
		},
	};
}
