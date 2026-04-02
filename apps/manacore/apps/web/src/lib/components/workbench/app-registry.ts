/**
 * App Component Registry — Maps app IDs to lazy-loaded views.
 *
 * Each entry provides a default `load` (list view) and optional named `views`
 * for in-panel navigation (detail, create, edit, etc.).
 */

import type { Component } from 'svelte';

export interface ViewEntry {
	load: () => Promise<{ default: Component }>;
}

export interface AppEntry {
	id: string;
	name: string;
	color: string;
	/** Default view loader (list/main view). */
	load: () => Promise<{ default: Component }>;
	/** Named views for in-panel navigation. Fallback: { list: load }. */
	views?: Record<string, ViewEntry>;
}

export const APP_REGISTRY: AppEntry[] = [
	{
		id: 'todo',
		name: 'Todo',
		color: '#8B5CF6',
		load: () => import('$lib/modules/todo/AppView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/todo/AppView.svelte') },
			detail: { load: () => import('$lib/modules/todo/views/DetailView.svelte') },
		},
	},
	{
		id: 'calendar',
		name: 'Kalender',
		color: '#3B82F6',
		load: () => import('$lib/modules/calendar/AppView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/calendar/AppView.svelte') },
			detail: { load: () => import('$lib/modules/calendar/views/DetailView.svelte') },
		},
	},
	{
		id: 'contacts',
		name: 'Kontakte',
		color: '#22C55E',
		load: () => import('$lib/modules/contacts/AppView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/contacts/AppView.svelte') },
			detail: { load: () => import('$lib/modules/contacts/views/DetailView.svelte') },
		},
	},
	{
		id: 'chat',
		name: 'Chat',
		color: '#6366F1',
		load: () => import('$lib/modules/chat/AppView.svelte'),
	},
	{
		id: 'times',
		name: 'Times',
		color: '#F59E0B',
		load: () => import('$lib/modules/times/AppView.svelte'),
	},
	{
		id: 'zitare',
		name: 'Zitare',
		color: '#EC4899',
		load: () => import('$lib/modules/zitare/AppView.svelte'),
	},
	{
		id: 'cards',
		name: 'Cards',
		color: '#EF4444',
		load: () => import('$lib/modules/cards/AppView.svelte'),
	},
	{
		id: 'picture',
		name: 'Picture',
		color: '#8B5CF6',
		load: () => import('$lib/modules/picture/AppView.svelte'),
	},
	{
		id: 'mukke',
		name: 'Mukke',
		color: '#F97316',
		load: () => import('$lib/modules/mukke/AppView.svelte'),
	},
	{
		id: 'photos',
		name: 'Photos',
		color: '#06B6D4',
		load: () => import('$lib/modules/photos/AppView.svelte'),
	},
	{
		id: 'storage',
		name: 'Storage',
		color: '#6B7280',
		load: () => import('$lib/modules/storage/AppView.svelte'),
	},
	{
		id: 'nutriphi',
		name: 'Nutriphi',
		color: '#22C55E',
		load: () => import('$lib/modules/nutriphi/AppView.svelte'),
	},
	{
		id: 'planta',
		name: 'Planta',
		color: '#16A34A',
		load: () => import('$lib/modules/planta/AppView.svelte'),
	},
	{
		id: 'presi',
		name: 'Presi',
		color: '#A855F7',
		load: () => import('$lib/modules/presi/AppView.svelte'),
	},
	{
		id: 'inventar',
		name: 'Inventar',
		color: '#78716C',
		load: () => import('$lib/modules/inventar/AppView.svelte'),
	},
	{
		id: 'memoro',
		name: 'Memoro',
		color: '#F59E0B',
		load: () => import('$lib/modules/memoro/AppView.svelte'),
	},
	{
		id: 'questions',
		name: 'Questions',
		color: '#2563EB',
		load: () => import('$lib/modules/questions/AppView.svelte'),
	},
	{
		id: 'skilltree',
		name: 'SkillTree',
		color: '#D946EF',
		load: () => import('$lib/modules/skilltree/AppView.svelte'),
	},
	{
		id: 'moodlit',
		name: 'Moodlit',
		color: '#F97316',
		load: () => import('$lib/modules/moodlit/AppView.svelte'),
	},
	{
		id: 'citycorners',
		name: 'CityCorners',
		color: '#14B8A6',
		load: () => import('$lib/modules/citycorners/AppView.svelte'),
	},
	{
		id: 'uload',
		name: 'uLoad',
		color: '#0EA5E9',
		load: () => import('$lib/modules/uload/AppView.svelte'),
	},
	{
		id: 'calc',
		name: 'Calc',
		color: '#6B7280',
		load: () => import('$lib/modules/calc/AppView.svelte'),
	},
	{
		id: 'playground',
		name: 'Playground',
		color: '#9CA3AF',
		load: () => import('$lib/modules/playground/AppView.svelte'),
	},
];

export function getAppEntry(appId: string): AppEntry | undefined {
	return APP_REGISTRY.find((a) => a.id === appId);
}
