/**
 * Minimized pages context — shared between layout and page via Svelte context.
 *
 * Layout creates the context, renders MinimizedTabs using its reactive state.
 * Page registers callbacks (restore/remove/togglePicker) and syncs its openPages.
 */
import type { MinimizedPage } from '@manacore/shared-ui';

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

export interface MinimizedPagesContext {
	/** Reactive list of minimized pages (read by layout for rendering) */
	readonly pages: MinimizedPage[];
	/** Whether there are any minimized pages */
	readonly hasPages: boolean;
	/** Sync open pages state from page component */
	sync(openPages: { id: string; minimized: boolean }[]): void;
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
		sync(openPages) {
			pages = openPages
				.filter((p) => p.minimized)
				.map((p) => {
					const meta = PAGE_META[p.id] ?? { title: p.id, color: '#6B7280' };
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
