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

export interface ParsedPlant {
	name: string;
	acquiredAt?: Date;
	tagNames: string[];
}

export interface ParsedPlantWithIds {
	name: string;
	acquiredAt?: string;
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

	if (parsed.acquiredAt) {
		parts.push(`📅 ${formatDatePreview(parsed.acquiredAt, locale)}`);
	}

	if (parsed.tagNames.length > 0) {
		parts.push(`🏷️ ${parsed.tagNames.join(', ')}`);
	}

	return parts.join(' · ');
}
