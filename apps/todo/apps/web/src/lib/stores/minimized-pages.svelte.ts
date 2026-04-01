/**
 * Minimized pages context — layout owns the state, page reads/writes via context.
 *
 * Layout calls `createMinimizedPagesContext()` + `setContext`.
 * Page calls `getContext('minimizedPages')` to get the same object.
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
	readonly pages: MinimizedPage[];
	readonly hasPages: boolean;
	/** Called by page to sync its openPages state */
	sync(openPages: { id: string; minimized: boolean }[]): void;
	/** Called by page on unmount */
	clear(): void;
}

export function createMinimizedPagesContext(): MinimizedPagesContext {
	let pages = $state<MinimizedPage[]>([]);

	return {
		get pages() {
			return pages;
		},
		get hasPages() {
			return pages.length > 0;
		},
		sync(openPages: { id: string; minimized: boolean }[]) {
			pages = openPages
				.filter((p) => p.minimized)
				.map((p) => {
					const meta = PAGE_META[p.id] ?? { title: p.id, color: '#6B7280' };
					return { id: p.id, title: meta.title, color: meta.color };
				});
		},
		clear() {
			pages = [];
		},
	};
}
