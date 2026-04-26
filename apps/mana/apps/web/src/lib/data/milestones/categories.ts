/**
 * Shared milestone categories — used by `firsts/` and `lasts/`.
 *
 * Both modules have the same 11-category vocabulary. Extracted here so
 * the second module didn't have to duplicate the enum + label/color
 * tables. See docs/plans/lasts-module.md.
 */

export type MilestoneCategory =
	| 'culinary'
	| 'adventure'
	| 'travel'
	| 'people'
	| 'career'
	| 'creative'
	| 'nature'
	| 'culture'
	| 'health'
	| 'tech'
	| 'other';

export const MILESTONE_CATEGORIES: MilestoneCategory[] = [
	'culinary',
	'adventure',
	'travel',
	'people',
	'career',
	'creative',
	'nature',
	'culture',
	'health',
	'tech',
	'other',
];

export const CATEGORY_LABELS: Record<MilestoneCategory, { de: string; en: string }> = {
	culinary: { de: 'Kulinarisch', en: 'Culinary' },
	adventure: { de: 'Abenteuer', en: 'Adventure' },
	travel: { de: 'Reisen', en: 'Travel' },
	people: { de: 'Menschen', en: 'People' },
	career: { de: 'Beruf', en: 'Career' },
	creative: { de: 'Kreativ', en: 'Creative' },
	nature: { de: 'Natur', en: 'Nature' },
	culture: { de: 'Kultur', en: 'Culture' },
	health: { de: 'Gesundheit', en: 'Health' },
	tech: { de: 'Technik', en: 'Tech' },
	other: { de: 'Sonstiges', en: 'Other' },
};

export const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
	culinary: '#f97316',
	adventure: '#ef4444',
	travel: '#0ea5e9',
	people: '#ec4899',
	career: '#6366f1',
	creative: '#a855f7',
	nature: '#22c55e',
	culture: '#eab308',
	health: '#14b8a6',
	tech: '#64748b',
	other: '#9ca3af',
};
