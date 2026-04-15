/**
 * Companion workbench settings — which pages the user currently has
 * open + their widths. Persisted to localStorage so layout survives
 * reloads; keep it tiny on purpose (no Dexie round-trip for every
 * resize).
 */

export type CompanionPageId =
	| 'home'
	| 'chat'
	| 'missions'
	| 'workbench'
	| 'rituals'
	| 'policy'
	| 'insights'
	| 'health';

export interface CompanionOpenPage {
	id: CompanionPageId;
	widthPx: number;
	heightPx?: number;
	maximized?: boolean;
}

const STORAGE_KEY = 'companion:openPages';
const DEFAULT_WIDTH = 520;

/** Fresh users open the home page with shortcuts to everything else. */
const DEFAULT_OPEN_PAGES: CompanionOpenPage[] = [{ id: 'home', widthPx: DEFAULT_WIDTH }];

function loadOpenPages(): CompanionOpenPage[] {
	if (typeof localStorage === 'undefined') return DEFAULT_OPEN_PAGES;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_OPEN_PAGES;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_OPEN_PAGES;
		return parsed as CompanionOpenPage[];
	} catch {
		return DEFAULT_OPEN_PAGES;
	}
}

function persist(pages: CompanionOpenPage[]): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
	} catch {
		// ignore quota / private-mode failures — layout falls back to default next load
	}
}

function createStore() {
	let openPages = $state<CompanionOpenPage[]>(loadOpenPages());

	return {
		get openPages() {
			return openPages;
		},
		openPage(id: CompanionPageId) {
			if (openPages.some((p) => p.id === id)) return;
			openPages = [...openPages, { id, widthPx: DEFAULT_WIDTH }];
			persist(openPages);
		},
		closePage(id: CompanionPageId) {
			openPages = openPages.filter((p) => p.id !== id);
			persist(openPages);
		},
		resize(id: CompanionPageId, widthPx: number, heightPx?: number) {
			openPages = openPages.map((p) => (p.id === id ? { ...p, widthPx, heightPx } : p));
			persist(openPages);
		},
		toggleMaximized(id: CompanionPageId) {
			openPages = openPages.map((p) => (p.id === id ? { ...p, maximized: !p.maximized } : p));
			persist(openPages);
		},
		moveLeft(id: CompanionPageId) {
			const idx = openPages.findIndex((p) => p.id === id);
			if (idx <= 0) return;
			const next = [...openPages];
			[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
			openPages = next;
			persist(openPages);
		},
		moveRight(id: CompanionPageId) {
			const idx = openPages.findIndex((p) => p.id === id);
			if (idx === -1 || idx >= openPages.length - 1) return;
			const next = [...openPages];
			[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
			openPages = next;
			persist(openPages);
		},
		reset() {
			openPages = [...DEFAULT_OPEN_PAGES];
			persist(openPages);
		},
	};
}

export const companionWorkbenchSettings = createStore();
