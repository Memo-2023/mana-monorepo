/**
 * Plant Parser for Planta App
 *
 * Extends the base parser with plant-specific patterns:
 * - Scientific names (italic Latin names)
 * - Acquisition date
 * - Tags for categories
 *
 * Examples:
 * - "Monstera deliciosa #tropisch"
 * - "Basilikum heute gekauft #kräuter"
 * - "Ficus benjamina morgen #zimmerpflanze"
 */

import {
	parseBaseInput,
	extractTags,
	combineDateAndTime,
	formatDatePreview,
	type ParserLocale,
} from '@manacore/shared-utils';

export type CareAction = 'watered' | 'repotted' | 'fertilized' | 'pruned';

export interface ParsedPlant {
	name: string;
	acquiredAt?: Date;
	tagNames: string[];
	action?: CareAction;
}

export interface ParsedPlantWithIds {
	name: string;
	acquiredAt?: string;
}

// Care action patterns per locale
const CARE_ACTION_PATTERNS_BY_LOCALE: Record<
	ParserLocale,
	{ action: CareAction; pattern: RegExp }[]
> = {
	de: [
		{ action: 'watered', pattern: /\b(?:gegossen|gewässert)\b/i },
		{ action: 'repotted', pattern: /\bumgetopft\b/i },
		{ action: 'fertilized', pattern: /\bgedüngt\b/i },
		{ action: 'pruned', pattern: /\b(?:geschnitten|gestutzt)\b/i },
	],
	en: [
		{ action: 'watered', pattern: /\bwatered\b/i },
		{ action: 'repotted', pattern: /\brepotted\b/i },
		{ action: 'fertilized', pattern: /\bfertilized\b/i },
		{ action: 'pruned', pattern: /\b(?:pruned|trimmed)\b/i },
	],
	fr: [
		{ action: 'watered', pattern: /\barrosé\b/i },
		{ action: 'repotted', pattern: /\brempoté\b/i },
		{ action: 'fertilized', pattern: /\bfertilisé\b/i },
		{ action: 'pruned', pattern: /\btaillé\b/i },
	],
	es: [
		{ action: 'watered', pattern: /\bregado\b/i },
		{ action: 'repotted', pattern: /\btrasplantado\b/i },
		{ action: 'fertilized', pattern: /\bfertilizado\b/i },
		{ action: 'pruned', pattern: /\bpodado\b/i },
	],
	it: [
		{ action: 'watered', pattern: /\bannaffiato\b/i },
		{ action: 'repotted', pattern: /\brinvasato\b/i },
		{ action: 'fertilized', pattern: /\bfertilizzato\b/i },
		{ action: 'pruned', pattern: /\bpotato\b/i },
	],
};

const ACTION_LABELS: Record<CareAction, Record<ParserLocale, string>> = {
	watered: { de: 'Gegossen', en: 'Watered', fr: 'Arrosé', es: 'Regado', it: 'Annaffiato' },
	repotted: { de: 'Umgetopft', en: 'Repotted', fr: 'Rempoté', es: 'Trasplantado', it: 'Rinvasato' },
	fertilized: {
		de: 'Gedüngt',
		en: 'Fertilized',
		fr: 'Fertilisé',
		es: 'Fertilizado',
		it: 'Fertilizzato',
	},
	pruned: { de: 'Geschnitten', en: 'Pruned', fr: 'Taillé', es: 'Podado', it: 'Potato' },
};

const ACTION_EMOJIS: Record<CareAction, string> = {
	watered: '💧',
	repotted: '🌱',
	fertilized: '🧪',
	pruned: '✂️',
};

function extractCareAction(
	text: string,
	locale: ParserLocale = 'de'
): { action?: CareAction; remaining: string } {
	const patterns = CARE_ACTION_PATTERNS_BY_LOCALE[locale];
	for (const { action, pattern } of patterns) {
		if (pattern.test(text)) {
			return {
				action,
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { action: undefined, remaining: text };
}

// Acquisition keywords per locale
const ACQUIRED_PATTERNS_BY_LOCALE: Record<ParserLocale, RegExp[]> = {
	de: [/\bgekauft\b/i, /\bbekommen\b/i, /\berhalten\b/i, /\bgepflanzt\b/i],
	en: [/\bbought\b/i, /\breceived\b/i, /\bgot\b/i, /\bplanted\b/i],
	fr: [/\bacheté\b/i, /\breçu\b/i, /\bplanté\b/i],
	es: [/\bcomprado\b/i, /\brecibido\b/i, /\bplantado\b/i],
	it: [/\bcomprato\b/i, /\bricevuto\b/i, /\bpiantato\b/i],
};

function extractAcquiredKeyword(
	text: string,
	locale: ParserLocale = 'de'
): { found: boolean; remaining: string } {
	const patterns = ACQUIRED_PATTERNS_BY_LOCALE[locale];
	for (const pattern of patterns) {
		if (pattern.test(text)) {
			return {
				found: true,
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { found: false, remaining: text };
}

/**
 * Parse natural language plant input
 *
 * Examples:
 * - "Monstera #tropisch"
 * - "Basilikum heute gekauft #kräuter"
 * - "Ficus benjamina"
 */
export function parsePlantInput(input: string, locale: ParserLocale = 'de'): ParsedPlant {
	let text = input.trim();

	// Extract care action BEFORE base parser so the action word is removed from title
	const careResult = extractCareAction(text, locale);
	text = careResult.remaining;

	// Check for acquisition keywords
	const acquiredResult = extractAcquiredKeyword(text, locale);
	text = acquiredResult.remaining;

	// Use base parser for date, time, tags
	const base = parseBaseInput(text, locale);

	// If we found a date (or acquisition keyword implies today)
	let acquiredAt: Date | undefined;
	if (base.date) {
		acquiredAt = combineDateAndTime(base.date, base.time);
	} else if (acquiredResult.found) {
		acquiredAt = new Date(); // "gekauft" without date = today
	}

	return {
		name: base.title,
		acquiredAt,
		tagNames: base.tagNames,
		action: careResult.action,
	};
}

/**
 * Resolve to API-ready format
 */
export function resolvePlantData(parsed: ParsedPlant): ParsedPlantWithIds {
	return {
		name: parsed.name,
		acquiredAt: parsed.acquiredAt?.toISOString(),
	};
}

/**
 * Format parsed plant for preview display
 */
export function formatParsedPlantPreview(parsed: ParsedPlant, locale: ParserLocale = 'de'): string {
	const parts: string[] = [];

	if (parsed.action) {
		const emoji = ACTION_EMOJIS[parsed.action];
		const label = ACTION_LABELS[parsed.action][locale];
		parts.push(`${emoji} ${label}`);
	}

	if (parsed.acquiredAt) {
		parts.push(`📅 ${formatDatePreview(parsed.acquiredAt, locale)}`);
	}

	if (parsed.tagNames.length > 0) {
		parts.push(`🏷️ ${parsed.tagNames.join(', ')}`);
	}

	return parts.join(' · ');
}
