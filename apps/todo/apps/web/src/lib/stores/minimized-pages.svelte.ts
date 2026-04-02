/**
 * Minimized pages context — shared between layout and page via Svelte context.
 *
 * Layout creates the context, renders MinimizedTabs using its reactive state.
 * Page registers callbacks (restore/remove/togglePicker) and syncs its openPages.
 */
import type { MinimizedPage } from '@manacore/shared-ui';
import type { PageConfig } from '$lib/stores/settings.svelte';

export const PAGE_META: Record<string, { title: string; color: string }> = {
	todo: { title: 'To Do', color: '#6B7280' },
	completed: { title: 'Erledigt', color: '#22C55E' },
	today: { title: 'Heute', color: '#F59E0B' },
	overdue: { title: 'Überfällig', color: '#EF4444' },
	all: { title: 'Alle Aufgaben', color: '#3B82F6' },
	'high-priority': { title: 'Hohe Priorität', color: '#EF4444' },
	'this-week': { title: 'Diese Woche', color: '#8B5CF6' },
	'no-date': { title: 'Ohne Datum', color: '#6B7280' },
};

/** Icon-to-color mapping for custom pages */
const ICON_COLORS: Record<string, string> = {
	warning: '#EF4444',
	calendar: '#3B82F6',
	'calendar-dots': '#8B5CF6',
	check: '#22C55E',
	star: '#F59E0B',
	lightning: '#F97316',
	clock: '#6B7280',
	fire: '#EF4444',
	leaf: '#22C55E',
	heart: '#EC4899',
};

/** Get display meta for a page, supporting both presets and custom pages */
export function getPageMeta(
	pageId: string,
	customPages: PageConfig[]
): { title: string; color: string } {
	if (PAGE_META[pageId]) return PAGE_META[pageId];
	const custom = customPages.find((p) => p.id === pageId);
	if (custom) {
		return {
			title: custom.label,
			color: ICON_COLORS[custom.icon ?? 'star'] ?? '#8B5CF6',
		};
	}
	return { title: pageId, color: '#6B7280' };
}

export interface MinimizedPagesContext {
	/** Reactive list of minimized pages (read by layout for rendering) */
	readonly pages: MinimizedPage[];
	/** Whether there are any minimized pages */
	readonly hasPages: boolean;
	/** Sync open pages state from page component */
	sync(openPages: { id: string; minimized: boolean }[], customPages?: PageConfig[]): void;
	/** Clear all pages (called on page unmount) */
	clear(): void;
	/** Restore a minimized page — delegates to registered callback */
	restore(pageId: string): void;
	/** Remove a page — delegates to registered callback */
	remove(pageId: string): void;
	/** Maximize a minimized page — delegates to registered callback */
	maximize(pageId: string): void;
	/** Toggle page picker — delegates to registered callback */
	togglePicker(): void;
	/** Page registers its handlers here */
	registerHandlers(handlers: {
		restore: (id: string) => void;
		remove: (id: string) => void;
		maximize: (id: string) => void;
		togglePicker: () => void;
	}): void;
}

export function createMinimizedPagesContext(): MinimizedPagesContext {
	let pages = $state<MinimizedPage[]>([]);
	let handlers = $state<{
		restore: (id: string) => void;
		remove: (id: string) => void;
		maximize: (id: string) => void;
		togglePicker: () => void;
	} | null>(null);

	return {
		get pages() {
			return pages;
		},
		get hasPages() {
			return pages.length > 0;
		},
		sync(openPages, customPages: PageConfig[] = []) {
			pages = openPages
				.filter((p) => p.minimized)
				.map((p) => {
					const meta = getPageMeta(p.id, customPages);
					return { id: p.id, title: meta.title, color: meta.color };
				});
		},
		clear() {
			pages = [];
			handlers = null;
		},
		restore(pageId) {
			handlers?.restore(pageId);
		},
		remove(pageId) {
			handlers?.remove(pageId);
		},
		maximize(pageId) {
			handlers?.maximize(pageId);
		},
		togglePicker() {
			handlers?.togglePicker();
		},
		registerHandlers(h) {
			handlers = h;
		},
	};
}
