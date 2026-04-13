/**
 * Recipes module types.
 *
 * Recipe = a cooking recipe with ingredients, steps, and metadata.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Subtypes ───────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Ingredient {
	name: string;
	amount: string; // string to allow "1/2", "eine Prise", etc.
	unit: string; // "g", "ml", "EL", "TL", "Stück", etc.
}

// ─── Local Record Type (Dexie) ──────────────────────────

export interface LocalRecipe extends BaseRecord {
	title: string;
	description: string;
	ingredients: Ingredient[];
	steps: string[];
	servings: number;
	prepTimeMin: number | null;
	cookTimeMin: number | null;
	difficulty: Difficulty;
	tags: string[];
	isFavorite: boolean;
	photoMediaId: string | null;
	photoUrl: string | null;
	photoThumbnailUrl: string | null;
}

// ─── Domain Type ────────────────────────────────────────

export interface Recipe {
	id: string;
	title: string;
	description: string;
	ingredients: Ingredient[];
	steps: string[];
	servings: number;
	prepTimeMin: number | null;
	cookTimeMin: number | null;
	difficulty: Difficulty;
	tags: string[];
	isFavorite: boolean;
	photoMediaId: string | null;
	photoUrl: string | null;
	photoThumbnailUrl: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ──────────────────────────────────────────

export const DIFFICULTY_LABELS: Record<Difficulty, { de: string; en: string }> = {
	easy: { de: 'Einfach', en: 'Easy' },
	medium: { de: 'Mittel', en: 'Medium' },
	hard: { de: 'Schwer', en: 'Hard' },
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
	easy: '#22c55e',
	medium: '#f59e0b',
	hard: '#ef4444',
};

export const DEFAULT_TAGS = [
	'Vegan',
	'Vegetarisch',
	'Glutenfrei',
	'Schnell',
	'Dessert',
	'Suppe',
	'Salat',
	'Italienisch',
	'Asiatisch',
	'Deutsch',
];

export const UNIT_OPTIONS = [
	'g',
	'kg',
	'ml',
	'L',
	'EL',
	'TL',
	'Stück',
	'Prise',
	'Bund',
	'Scheibe',
	'Dose',
	'Becher',
	'',
];
