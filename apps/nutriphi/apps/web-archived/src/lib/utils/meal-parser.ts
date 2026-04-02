/**
 * Meal Parser for NutriPhi App
 *
 * Parses natural language input for quick meal logging.
 * Extracts meal type and food description for AI analysis.
 *
 * Examples:
 * - "Spaghetti Bolognese mittagessen"
 * - "2 Eier, Toast, Orangensaft frühstück"
 * - "Apfel snack"
 * - "Hähnchenbrust mit Reis und Salat"
 */

import type { MealType } from '@nutriphi/shared';
import { suggestMealType } from '@nutriphi/shared';
import type { ParserLocale } from '@manacore/shared-utils';

export interface FoodItem {
	amount?: number;
	unit?: string;
	name: string;
}

export interface ParsedMeal {
	description: string;
	mealType: MealType;
	mealTypeExplicit: boolean; // Was meal type explicitly mentioned?
	foodItems: FoodItem[];
}

// Meal type patterns per locale
const MEAL_TYPE_PATTERNS_BY_LOCALE: Record<ParserLocale, { pattern: RegExp; type: MealType }[]> = {
	de: [
		{ pattern: /\bfrühstück\b/i, type: 'breakfast' },
		{ pattern: /\bmittagessen\b/i, type: 'lunch' },
		{ pattern: /\babendessen\b/i, type: 'dinner' },
		{ pattern: /\bsnack\b/i, type: 'snack' },
		{ pattern: /\bmorgens\b/i, type: 'breakfast' },
		{ pattern: /\bmittags\b/i, type: 'lunch' },
		{ pattern: /\babends\b/i, type: 'dinner' },
		{ pattern: /\bnachtisch\b/i, type: 'snack' },
		{ pattern: /\bzwischenmahlzeit\b/i, type: 'snack' },
	],
	en: [
		{ pattern: /\bbreakfast\b/i, type: 'breakfast' },
		{ pattern: /\blunch\b/i, type: 'lunch' },
		{ pattern: /\bdinner\b/i, type: 'dinner' },
		{ pattern: /\bsnack\b/i, type: 'snack' },
		{ pattern: /\bmorning\b/i, type: 'breakfast' },
		{ pattern: /\bnoon\b/i, type: 'lunch' },
		{ pattern: /\bevening\b/i, type: 'dinner' },
	],
	fr: [
		{ pattern: /\bpetit[- ]d[ée]jeuner\b/i, type: 'breakfast' },
		{ pattern: /\bd[ée]jeuner\b/i, type: 'lunch' },
		{ pattern: /\bd[îi]ner\b/i, type: 'dinner' },
		{ pattern: /\bgo[ûu]ter\b/i, type: 'snack' },
		{ pattern: /\bmatin\b/i, type: 'breakfast' },
		{ pattern: /\bmidi\b/i, type: 'lunch' },
		{ pattern: /\bsoir\b/i, type: 'dinner' },
	],
	es: [
		{ pattern: /\bdesayuno\b/i, type: 'breakfast' },
		{ pattern: /\balmuerzo\b/i, type: 'lunch' },
		{ pattern: /\bcena\b/i, type: 'dinner' },
		{ pattern: /\bmerienda\b/i, type: 'snack' },
	],
	it: [
		{ pattern: /\bcolazione\b/i, type: 'breakfast' },
		{ pattern: /\bpranzo\b/i, type: 'lunch' },
		{ pattern: /\bcena\b/i, type: 'dinner' },
		{ pattern: /\bspuntino\b/i, type: 'snack' },
	],
};

// Meal type labels per locale
const MEAL_TYPE_LABELS_BY_LOCALE: Record<ParserLocale, Record<MealType, string>> = {
	de: {
		breakfast: 'Frühstück',
		lunch: 'Mittagessen',
		dinner: 'Abendessen',
		snack: 'Snack',
	},
	en: {
		breakfast: 'Breakfast',
		lunch: 'Lunch',
		dinner: 'Dinner',
		snack: 'Snack',
	},
	fr: {
		breakfast: 'Petit-déjeuner',
		lunch: 'Déjeuner',
		dinner: 'Dîner',
		snack: 'Goûter',
	},
	es: {
		breakfast: 'Desayuno',
		lunch: 'Almuerzo',
		dinner: 'Cena',
		snack: 'Merienda',
	},
	it: {
		breakfast: 'Colazione',
		lunch: 'Pranzo',
		dinner: 'Cena',
		snack: 'Spuntino',
	},
};

// Auto-detection hint per locale
const AUTO_HINT_BY_LOCALE: Record<ParserLocale, string> = {
	de: 'automatisch',
	en: 'auto-detected',
	fr: 'automatique',
	es: 'automático',
	it: 'automatico',
};

// Units recognized by the parser
const UNITS_PATTERN =
	/^(g|kg|mg|ml|l|dl|cl|Stück|Scheibe|Scheiben|Tasse|Tassen|EL|TL|pieces?|cups?|slices?|oz|lb)\b/i;

// Amount pattern: integers, decimals, or fractions like 1/2
const AMOUNT_PATTERN = /^(\d+\/\d+|\d+(?:[.,]\d+)?)/;

/**
 * Parse a single food item string into structured FoodItem
 */
function parseSingleFoodItem(text: string): FoodItem {
	let remaining = text.trim();

	// Try to extract amount
	let amount: number | undefined;
	const amountMatch = remaining.match(AMOUNT_PATTERN);
	if (amountMatch) {
		const raw = amountMatch[1];
		if (raw.includes('/')) {
			const [num, den] = raw.split('/');
			amount = parseInt(num, 10) / parseInt(den, 10);
		} else {
			amount = parseFloat(raw.replace(',', '.'));
		}
		remaining = remaining.slice(amountMatch[0].length).trim();
	}

	// Try to extract unit (only if we found an amount, or unit is at the start)
	let unit: string | undefined;
	const unitMatch = remaining.match(UNITS_PATTERN);
	if (unitMatch) {
		unit = unitMatch[1];
		remaining = remaining.slice(unitMatch[0].length).trim();
	}

	return {
		...(amount !== undefined && { amount }),
		...(unit !== undefined && { unit }),
		name: remaining,
	};
}

/**
 * Parse a description string into individual food items.
 * Splits on commas and parses each segment for amount, unit, and name.
 */
export function parseFoodItems(text: string): FoodItem[] {
	if (!text.trim()) return [];

	const segments = text
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	return segments.map(parseSingleFoodItem);
}

function extractMealType(
	text: string,
	locale: ParserLocale = 'de'
): { mealType?: MealType; remaining: string } {
	const patterns = MEAL_TYPE_PATTERNS_BY_LOCALE[locale];
	for (const { pattern, type } of patterns) {
		if (pattern.test(text)) {
			return {
				mealType: type,
				remaining: text.replace(pattern, '').trim(),
			};
		}
	}
	return { mealType: undefined, remaining: text };
}

/**
 * Parse natural language meal input
 */
export function parseMealInput(input: string, locale: ParserLocale = 'de'): ParsedMeal {
	let text = input.trim();

	// Extract explicit meal type
	const mealTypeResult = extractMealType(text, locale);
	text = mealTypeResult.remaining;

	// Clean up description
	const description = text.replace(/\s+/g, ' ').trim();

	// Parse food items from description
	const foodItems = parseFoodItems(description);

	// Use explicit meal type or auto-detect based on time of day
	const mealType = mealTypeResult.mealType || suggestMealType();

	return {
		description,
		mealType,
		mealTypeExplicit: !!mealTypeResult.mealType,
		foodItems,
	};
}

/**
 * Format parsed meal for preview display
 */
export function formatParsedMealPreview(parsed: ParsedMeal, locale: ParserLocale = 'de'): string {
	const parts: string[] = [];

	const labels = MEAL_TYPE_LABELS_BY_LOCALE[locale];
	parts.push(`🍽️ ${labels[parsed.mealType]}`);

	if (!parsed.mealTypeExplicit) {
		parts.push(`(${AUTO_HINT_BY_LOCALE[locale]})`);
	}

	if (parsed.foodItems.length > 0) {
		parts.push(`🥚 ${parsed.foodItems.length} items`);
	}

	return parts.join(' ');
}
