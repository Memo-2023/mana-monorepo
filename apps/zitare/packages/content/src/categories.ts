/**
 * Quote categories
 */
export const CATEGORIES = [
	'motivation',
	'weisheit',
	'liebe',
	'leben',
	'erfolg',
	'glueck',
	'freundschaft',
	'mut',
	'hoffnung',
	'natur',
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * German labels for categories
 */
export const CATEGORY_LABELS: Record<Category, string> = {
	motivation: 'Motivation',
	weisheit: 'Weisheit',
	liebe: 'Liebe',
	leben: 'Leben',
	erfolg: 'Erfolg',
	glueck: 'Glueck',
	freundschaft: 'Freundschaft',
	mut: 'Mut',
	hoffnung: 'Hoffnung',
	natur: 'Natur',
};

/**
 * Get label for a category
 */
export function getCategoryLabel(category: Category): string {
	return CATEGORY_LABELS[category];
}

/**
 * Check if a string is a valid category
 */
export function isValidCategory(value: string): value is Category {
	return CATEGORIES.includes(value as Category);
}
