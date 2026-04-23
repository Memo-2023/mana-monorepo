/**
 * Wardrobe module — display constants.
 *
 * CATEGORY_ORDER is the order the tabs and pickers render in; CATEGORY_LABELS
 * is the DE display label per category id. OCCASION_LABELS + SEASON_LABELS
 * are consumed by the M3 outfit composer.
 */

import type { GarmentCategory, OutfitOccasion, OutfitSeason } from './types';

export const CATEGORY_ORDER: readonly GarmentCategory[] = [
	'top',
	'bottom',
	'dress',
	'outerwear',
	'shoes',
	'bag',
	'accessory',
	'glasses',
	'jewelry',
	'hat',
	'other',
] as const;

export const CATEGORY_LABELS: Record<GarmentCategory, string> = {
	top: 'Oberteile',
	bottom: 'Hosen',
	dress: 'Kleider',
	outerwear: 'Jacken',
	shoes: 'Schuhe',
	bag: 'Taschen',
	accessory: 'Accessoires',
	glasses: 'Brillen',
	jewelry: 'Schmuck',
	hat: 'Kopfbedeckung',
	other: 'Sonstiges',
};

export const CATEGORY_LABELS_SINGULAR: Record<GarmentCategory, string> = {
	top: 'Oberteil',
	bottom: 'Hose',
	dress: 'Kleid',
	outerwear: 'Jacke',
	shoes: 'Schuh',
	bag: 'Tasche',
	accessory: 'Accessoire',
	glasses: 'Brille',
	jewelry: 'Schmuck',
	hat: 'Kopfbedeckung',
	other: 'Item',
};

export const OCCASION_ORDER: readonly OutfitOccasion[] = [
	'casual',
	'work',
	'formal',
	'workout',
	'date',
	'travel',
	'event',
	'sleep',
	'other',
] as const;

export const OCCASION_LABELS: Record<OutfitOccasion, string> = {
	casual: 'Casual',
	work: 'Arbeit',
	formal: 'Festlich',
	workout: 'Sport',
	date: 'Date',
	travel: 'Reise',
	event: 'Event',
	sleep: 'Schlafanzug',
	other: 'Sonstiges',
};

export const SEASON_LABELS: Record<OutfitSeason, string> = {
	spring: 'Frühling',
	summer: 'Sommer',
	autumn: 'Herbst',
	winter: 'Winter',
};
