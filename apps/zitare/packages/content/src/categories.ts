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
	'humor',
	'wissenschaft',
	'kunst',
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
	glueck: 'Glück',
	freundschaft: 'Freundschaft',
	mut: 'Mut',
	hoffnung: 'Hoffnung',
	natur: 'Natur',
	humor: 'Humor',
	wissenschaft: 'Wissenschaft',
	kunst: 'Kunst',
};

/** Curated theme decks — cross-category collections around a topic. */
export const THEME_DECKS = [
	{
		id: 'stoizismus',
		label: 'Stoizismus',
		description: 'Gelassenheit und innere Stärke',
		authors: ['Marcus Aurelius', 'Seneca', 'Epiktet'],
	},
	{
		id: 'feminismus',
		label: 'Feminismus',
		description: 'Gleichberechtigung und Selbstbestimmung',
		authors: ['Simone de Beauvoir', 'Virginia Woolf', 'Maya Angelou', 'Marie Curie', 'Frida Kahlo'],
	},
	{
		id: 'unternehmertum',
		label: 'Unternehmertum',
		description: 'Innovation und Durchhaltevermögen',
		authors: ['Steve Jobs', 'Henry Ford', 'Thomas Edison', 'Walt Disney'],
	},
	{
		id: 'philosophie',
		label: 'Philosophie',
		description: 'Die großen Fragen des Lebens',
		authors: [
			'Sokrates',
			'Platon',
			'Aristoteles',
			'Immanuel Kant',
			'Friedrich Nietzsche',
			'Konfuzius',
			'Laozi',
		],
	},
	{
		id: 'literatur',
		label: 'Literatur',
		description: 'Worte der großen Dichter und Schriftsteller',
		authors: [
			'Johann Wolfgang von Goethe',
			'Oscar Wilde',
			'Mark Twain',
			'William Shakespeare',
			'Rainer Maria Rilke',
		],
	},
] as const;

export type ThemeDeckId = (typeof THEME_DECKS)[number]['id'];

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
