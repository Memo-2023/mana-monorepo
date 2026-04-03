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
		load: () => import('$lib/modules/todo/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/todo/ListView.svelte') },
			detail: { load: () => import('$lib/modules/todo/views/DetailView.svelte') },
		},
	},
	{
		id: 'calendar',
		name: 'Kalender',
		color: '#3B82F6',
		load: () => import('$lib/modules/calendar/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/calendar/ListView.svelte') },
			detail: { load: () => import('$lib/modules/calendar/views/DetailView.svelte') },
		},
	},
	{
		id: 'contacts',
		name: 'Kontakte',
		color: '#22C55E',
		load: () => import('$lib/modules/contacts/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/contacts/ListView.svelte') },
			detail: { load: () => import('$lib/modules/contacts/views/DetailView.svelte') },
		},
	},
	{
		id: 'chat',
		name: 'Chat',
		color: '#6366F1',
		load: () => import('$lib/modules/chat/ListView.svelte'),
	},
	{
		id: 'times',
		name: 'Times',
		color: '#F59E0B',
		load: () => import('$lib/modules/times/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/times/ListView.svelte') },
			detail: { load: () => import('$lib/modules/times/views/DetailView.svelte') },
		},
	},
	{
		id: 'zitare',
		name: 'Zitare',
		color: '#EC4899',
		load: () => import('$lib/modules/zitare/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/zitare/ListView.svelte') },
			detail: { load: () => import('$lib/modules/zitare/views/DetailView.svelte') },
		},
	},
	{
		id: 'cards',
		name: 'Cards',
		color: '#EF4444',
		load: () => import('$lib/modules/cards/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/cards/ListView.svelte') },
			detail: { load: () => import('$lib/modules/cards/views/DetailView.svelte') },
		},
	},
	{
		id: 'picture',
		name: 'Picture',
		color: '#8B5CF6',
		load: () => import('$lib/modules/picture/ListView.svelte'),
	},
	{
		id: 'mukke',
		name: 'Mukke',
		color: '#F97316',
		load: () => import('$lib/modules/mukke/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/mukke/ListView.svelte') },
			detail: { load: () => import('$lib/modules/mukke/views/DetailView.svelte') },
		},
	},
	{
		id: 'photos',
		name: 'Photos',
		color: '#06B6D4',
		load: () => import('$lib/modules/photos/ListView.svelte'),
	},
	{
		id: 'storage',
		name: 'Storage',
		color: '#6B7280',
		load: () => import('$lib/modules/storage/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/storage/ListView.svelte') },
			detail: { load: () => import('$lib/modules/storage/views/DetailView.svelte') },
		},
	},
	{
		id: 'nutriphi',
		name: 'Nutriphi',
		color: '#22C55E',
		load: () => import('$lib/modules/nutriphi/ListView.svelte'),
	},
	{
		id: 'planta',
		name: 'Planta',
		color: '#16A34A',
		load: () => import('$lib/modules/planta/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/planta/ListView.svelte') },
			detail: { load: () => import('$lib/modules/planta/views/DetailView.svelte') },
		},
	},
	{
		id: 'presi',
		name: 'Presi',
		color: '#A855F7',
		load: () => import('$lib/modules/presi/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/presi/ListView.svelte') },
			detail: { load: () => import('$lib/modules/presi/views/DetailView.svelte') },
		},
	},
	{
		id: 'inventar',
		name: 'Inventar',
		color: '#78716C',
		load: () => import('$lib/modules/inventar/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/inventar/ListView.svelte') },
			detail: { load: () => import('$lib/modules/inventar/views/DetailView.svelte') },
		},
	},
	{
		id: 'memoro',
		name: 'Memoro',
		color: '#F59E0B',
		load: () => import('$lib/modules/memoro/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/memoro/ListView.svelte') },
			detail: { load: () => import('$lib/modules/memoro/views/DetailView.svelte') },
		},
	},
	{
		id: 'questions',
		name: 'Questions',
		color: '#2563EB',
		load: () => import('$lib/modules/questions/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/questions/ListView.svelte') },
			detail: { load: () => import('$lib/modules/questions/views/DetailView.svelte') },
		},
	},
	{
		id: 'skilltree',
		name: 'SkillTree',
		color: '#D946EF',
		load: () => import('$lib/modules/skilltree/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/skilltree/ListView.svelte') },
			detail: { load: () => import('$lib/modules/skilltree/views/DetailView.svelte') },
		},
	},
	{
		id: 'moodlit',
		name: 'Moodlit',
		color: '#F97316',
		load: () => import('$lib/modules/moodlit/ListView.svelte'),
	},
	{
		id: 'citycorners',
		name: 'CityCorners',
		color: '#14B8A6',
		load: () => import('$lib/modules/citycorners/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/citycorners/ListView.svelte') },
			detail: { load: () => import('$lib/modules/citycorners/views/DetailView.svelte') },
		},
	},
	{
		id: 'uload',
		name: 'uLoad',
		color: '#0EA5E9',
		load: () => import('$lib/modules/uload/ListView.svelte'),
		views: {
			list: { load: () => import('$lib/modules/uload/ListView.svelte') },
			detail: { load: () => import('$lib/modules/uload/views/DetailView.svelte') },
		},
	},
	{
		id: 'calc',
		name: 'Calc',
		color: '#6B7280',
		load: () => import('$lib/modules/calc/ListView.svelte'),
	},
	{
		id: 'playground',
		name: 'Playground',
		color: '#9CA3AF',
		load: () => import('$lib/modules/playground/ListView.svelte'),
	},
];

export function getAppEntry(appId: string): AppEntry | undefined {
	return APP_REGISTRY.find((a) => a.id === appId);
}
