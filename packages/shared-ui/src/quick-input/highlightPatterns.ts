import type { HighlightPattern } from './types';

/** Shared patterns that work across all locales (symbols, not words) */
const UNIVERSAL_PATTERNS: HighlightPattern[] = [
	// Priority shortcuts: !!! = urgent, !! = high
	{ pattern: /!{3,}/g, className: 'hl-priority-urgent' },
	{ pattern: /!{2}/g, className: 'hl-priority-high' },
	// Tags
	{ pattern: /#\w+/g, className: 'hl-tag' },
	// Projects/Calendars/Companies (@reference)
	{ pattern: /@\w+/g, className: 'hl-reference' },
	// Time patterns (universal formats)
	{ pattern: /\b\d{1,2}:\d{2}\b/g, className: 'hl-time' },
];

/** German date/priority keywords */
const DE_PATTERNS: HighlightPattern[] = [
	{ pattern: /\b!?dringend\b/gi, className: 'hl-priority-urgent' },
	{ pattern: /\b!?wichtig\b/gi, className: 'hl-priority-high' },
	{ pattern: /\b!?normal\b/gi, className: 'hl-priority-medium' },
	{ pattern: /\b!?sp[aä]ter\b/gi, className: 'hl-priority-low' },
	{
		pattern:
			/\b(heute|morgen|übermorgen|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|nächsten?\s+\w+|in\s+\d+\s+tagen?)\b/gi,
		className: 'hl-date',
	},
	{ pattern: /\b(um\s+\d{1,2}(\s*uhr)?|\d{1,2}\s*uhr)\b/gi, className: 'hl-time' },
];

/** English date/priority keywords */
const EN_PATTERNS: HighlightPattern[] = [
	{ pattern: /\b!?urgent\b/gi, className: 'hl-priority-urgent' },
	{ pattern: /\b!?(important|high)\b/gi, className: 'hl-priority-high' },
	{ pattern: /\b!?(normal|medium)\b/gi, className: 'hl-priority-medium' },
	{ pattern: /\b!?(low|later)\b/gi, className: 'hl-priority-low' },
	{
		pattern:
			/\b(today|tomorrow|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+|in\s+\d+\s+days?)\b/gi,
		className: 'hl-date',
	},
	{ pattern: /\b(at\s+\d{1,2}(:\d{2})?\s*(am|pm)?)\b/gi, className: 'hl-time' },
];

/** French date/priority keywords */
const FR_PATTERNS: HighlightPattern[] = [
	{ pattern: /\b!?urgent[e]?\b/gi, className: 'hl-priority-urgent' },
	{ pattern: /\b!?(important[e]?|haut[e]?)\b/gi, className: 'hl-priority-high' },
	{ pattern: /\b!?(normal[e]?|moyen(?:ne)?)\b/gi, className: 'hl-priority-medium' },
	{ pattern: /\b!?(bas(?:se)?|plus\s+tard)\b/gi, className: 'hl-priority-low' },
	{
		pattern:
			/\b(aujourd'hui|demain|après-demain|hier|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|prochain[e]?\s+\w+|dans\s+\d+\s+jours?)\b/gi,
		className: 'hl-date',
	},
	{ pattern: /\b(à\s+\d{1,2}[h:]\d{0,2})\b/gi, className: 'hl-time' },
];

/** Italian date/priority keywords */
const IT_PATTERNS: HighlightPattern[] = [
	{ pattern: /\b!?urgente\b/gi, className: 'hl-priority-urgent' },
	{ pattern: /\b!?(importante|alto)\b/gi, className: 'hl-priority-high' },
	{ pattern: /\b!?(normale|medio)\b/gi, className: 'hl-priority-medium' },
	{ pattern: /\b!?(basso|dopo)\b/gi, className: 'hl-priority-low' },
	{
		pattern:
			/\b(oggi|domani|dopodomani|ieri|luned[ìi]|marted[ìi]|mercoled[ìi]|gioved[ìi]|venerd[ìi]|sabato|domenica|prossim[oa]\s+\w+|tra\s+\d+\s+giorn[oi])\b/gi,
		className: 'hl-date',
	},
	{ pattern: /\b(alle\s+\d{1,2}[.:]\d{0,2})\b/gi, className: 'hl-time' },
];

/** Spanish date/priority keywords */
const ES_PATTERNS: HighlightPattern[] = [
	{ pattern: /\b!?urgente\b/gi, className: 'hl-priority-urgent' },
	{ pattern: /\b!?(importante|alto)\b/gi, className: 'hl-priority-high' },
	{ pattern: /\b!?(normal|medio)\b/gi, className: 'hl-priority-medium' },
	{ pattern: /\b!?(bajo|luego)\b/gi, className: 'hl-priority-low' },
	{
		pattern:
			/\b(hoy|mañana|pasado\s+mañana|ayer|lunes|martes|miércoles|jueves|viernes|sábado|domingo|próxim[oa]\s+\w+|en\s+\d+\s+d[ií]as?)\b/gi,
		className: 'hl-date',
	},
	{ pattern: /\b(a\s+las?\s+\d{1,2}[.:]\d{0,2})\b/gi, className: 'hl-time' },
];

const LOCALE_PATTERNS: Record<string, HighlightPattern[]> = {
	de: DE_PATTERNS,
	en: EN_PATTERNS,
	fr: FR_PATTERNS,
	it: IT_PATTERNS,
	es: ES_PATTERNS,
};

/**
 * Get highlight patterns for a given locale.
 * Returns universal patterns + locale-specific patterns.
 * Falls back to German if locale is unknown.
 */
export function getHighlightPatterns(locale = 'de'): HighlightPattern[] {
	// Normalize locale (e.g., "en-US" -> "en")
	const lang = locale.split('-')[0].toLowerCase();
	const localeSpecific = LOCALE_PATTERNS[lang] || LOCALE_PATTERNS['de'];
	return [...UNIVERSAL_PATTERNS, ...localeSpecific];
}
