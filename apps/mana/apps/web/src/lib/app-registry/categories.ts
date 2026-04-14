/**
 * App Categories — Groups apps in the workbench AppPagePicker so users
 * can find pages by intent rather than scanning an alphabetical list.
 *
 * Five categories (Vorschlag C):
 *   - companion: Companion Brain pages (myday, activity, companion, goals)
 *   - life:      Personal / wellness / everyday-life tracking
 *   - work:      Productivity & planning
 *   - creative:  Creative, learning, generation
 *   - system:    Settings, admin, help, billing — everything meta
 *
 * Category assignment lives in APP_CATEGORY_MAP (keyed by appId) so
 * registerApp() calls stay unchanged. Anything not in the map falls
 * back to 'system'.
 */

import type { Component } from 'svelte';
import { Robot, Heart, Briefcase, Sparkle, Gear } from '@mana/shared-icons';

export type AppCategory = 'companion' | 'life' | 'work' | 'creative' | 'system';

export interface CategoryMeta {
	id: AppCategory;
	label: string;
	icon: Component;
	order: number;
}

export const APP_CATEGORIES: CategoryMeta[] = [
	{ id: 'companion', label: 'Companion', icon: Robot, order: 0 },
	{ id: 'life', label: 'Leben', icon: Heart, order: 1 },
	{ id: 'work', label: 'Arbeit', icon: Briefcase, order: 2 },
	{ id: 'creative', label: 'Kreativ', icon: Sparkle, order: 3 },
	{ id: 'system', label: 'System', icon: Gear, order: 4 },
];

/**
 * appId → AppCategory. Apps not listed here default to 'system'.
 */
export const APP_CATEGORY_MAP: Record<string, AppCategory> = {
	// Companion Brain
	myday: 'companion',
	activity: 'companion',
	companion: 'companion',
	goals: 'companion',

	// Leben — personal, wellness, everyday
	habits: 'life',
	body: 'life',
	sleep: 'life',
	mood: 'life',
	stretch: 'life',
	period: 'life',
	dreams: 'life',
	drink: 'life',
	meditate: 'life',
	journal: 'life',
	food: 'life',
	recipes: 'life',
	plants: 'life',
	finance: 'life',
	contacts: 'life',
	places: 'life',
	citycorners: 'life',
	news: 'life',
	inventory: 'life',
	storage: 'life',
	who: 'life',
	firsts: 'life',
	memoro: 'life',
	questions: 'life',

	// Arbeit — productivity, planning, communication
	todo: 'work',
	calendar: 'work',
	notes: 'work',
	times: 'work',
	events: 'work',
	mail: 'work',
	chat: 'work',
	context: 'work',
	automations: 'work',
	calc: 'work',

	// Kreativ — generation, learning, media
	music: 'creative',
	picture: 'creative',
	photos: 'creative',
	presi: 'creative',
	moodlit: 'creative',
	cards: 'creative',
	skilltree: 'creative',
	guides: 'creative',
	zitare: 'creative',
	uload: 'creative',
	playground: 'creative',

	// System — settings, admin, meta
	settings: 'system',
	themes: 'system',
	profile: 'system',
	admin: 'system',
	'api-keys': 'system',
	help: 'system',
	feedback: 'system',
	subscription: 'system',
};

export function getAppCategory(appId: string): AppCategory {
	return APP_CATEGORY_MAP[appId] ?? 'system';
}

export function getCategoryMeta(id: AppCategory): CategoryMeta {
	return APP_CATEGORIES.find((c) => c.id === id) ?? APP_CATEGORIES[APP_CATEGORIES.length - 1];
}
