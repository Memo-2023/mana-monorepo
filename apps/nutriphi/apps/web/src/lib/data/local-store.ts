/**
 * NutriPhi — Local-First Data Layer
 *
 * Meals, nutrition, goals, and favorites stored locally.
 * AI analysis and recommendations remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestMeals, guestGoals } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalMeal extends BaseRecord {
	date: string;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	inputType: 'photo' | 'text';
	description: string;
	portionSize?: string | null;
	confidence: number;
	nutrition?: {
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
		fiber: number;
		sugar: number;
	} | null;
}

export interface LocalGoal extends BaseRecord {
	dailyCalories: number;
	dailyProtein?: number | null;
	dailyCarbs?: number | null;
	dailyFat?: number | null;
	dailyFiber?: number | null;
}

export interface LocalFavorite extends BaseRecord {
	name: string;
	description: string;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	nutrition: {
		calories: number;
		protein: number;
		carbohydrates: number;
		fat: number;
		fiber: number;
		sugar: number;
	};
	usageCount: number;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const nutriphiStore = createLocalStore({
	appId: 'nutriphi',
	collections: [
		{
			name: 'meals',
			indexes: ['date', 'mealType', '[date+mealType]'],
			guestSeed: guestMeals,
		},
		{
			name: 'goals',
			indexes: [],
			guestSeed: guestGoals,
		},
		{
			name: 'favorites',
			indexes: ['mealType', 'usageCount'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const mealCollection = nutriphiStore.collection<LocalMeal>('meals');
export const goalCollection = nutriphiStore.collection<LocalGoal>('goals');
export const favoriteCollection = nutriphiStore.collection<LocalFavorite>('favorites');
