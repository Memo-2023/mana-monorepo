/**
 * Drink module types.
 *
 * DrinkEntry = a single logged drink with quantity and type
 * DrinkPreset = a saved favourite drink for quick-add
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Drink Types ─────────────────────────────────────────

export type DrinkType =
	| 'water'
	| 'coffee'
	| 'tea'
	| 'juice'
	| 'soda'
	| 'smoothie'
	| 'milk'
	| 'beer'
	| 'wine'
	| 'cocktail'
	| 'spirit'
	| 'energy'
	| 'other';

// ─── Local Record Types (Dexie) ──────────────────────────

export interface LocalDrinkEntry extends BaseRecord {
	name: string;
	drinkType: DrinkType;
	quantityMl: number;
	date: string; // YYYY-MM-DD
	time: string; // HH:mm
	note: string | null;
	presetId: string | null;
}

export interface LocalDrinkPreset extends BaseRecord {
	name: string;
	icon: string;
	color: string;
	drinkType: DrinkType;
	defaultQuantityMl: number;
	order: number;
	isArchived: boolean;
}

// ─── Domain Types ────────────────────────────────────────

export interface DrinkEntry {
	id: string;
	name: string;
	drinkType: DrinkType;
	quantityMl: number;
	date: string;
	time: string;
	note: string | null;
	presetId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface DrinkPreset {
	id: string;
	name: string;
	icon: string;
	color: string;
	drinkType: DrinkType;
	defaultQuantityMl: number;
	order: number;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────

export const DRINK_TYPE_LABELS: Record<DrinkType, { de: string; en: string }> = {
	water: { de: 'Wasser', en: 'Water' },
	coffee: { de: 'Kaffee', en: 'Coffee' },
	tea: { de: 'Tee', en: 'Tea' },
	juice: { de: 'Saft', en: 'Juice' },
	soda: { de: 'Limonade', en: 'Soda' },
	smoothie: { de: 'Smoothie', en: 'Smoothie' },
	milk: { de: 'Milch', en: 'Milk' },
	beer: { de: 'Bier', en: 'Beer' },
	wine: { de: 'Wein', en: 'Wine' },
	cocktail: { de: 'Cocktail', en: 'Cocktail' },
	spirit: { de: 'Spirituose', en: 'Spirit' },
	energy: { de: 'Energy Drink', en: 'Energy Drink' },
	other: { de: 'Sonstiges', en: 'Other' },
};

export const DRINK_TYPE_ICONS: Record<DrinkType, string> = {
	water: 'drop',
	coffee: 'coffee',
	tea: 'coffee', // Phosphor doesn't have a teacup, use coffee
	juice: 'orange-slice',
	soda: 'beer-bottle',
	smoothie: 'blender',
	milk: 'cow',
	beer: 'beer-stein',
	wine: 'wine',
	cocktail: 'martini',
	spirit: 'martini',
	energy: 'lightning',
	other: 'drop',
};

export const DRINK_TYPE_COLORS: Record<DrinkType, string> = {
	water: '#3b82f6',
	coffee: '#92400e',
	tea: '#65a30d',
	juice: '#f97316',
	soda: '#ef4444',
	smoothie: '#a855f7',
	milk: '#e5e7eb',
	beer: '#f59e0b',
	wine: '#881337',
	cocktail: '#ec4899',
	spirit: '#6366f1',
	energy: '#22d3ee',
	other: '#6b7280',
};

/** Default daily goal in ml */
export const DEFAULT_DAILY_GOAL_ML = 2500;
