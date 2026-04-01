/**
 * App Navigation Store
 *
 * Tracks favorite apps, recently visited apps, and usage counts.
 * Persists to localStorage for cross-session retention.
 * Pattern follows recentInputHistory.ts
 */

const STORAGE_KEY_FAVORITES = 'mana-app-favorites';
const STORAGE_KEY_RECENT = 'mana-app-recent';
const STORAGE_KEY_USAGE = 'mana-app-usage-counts';
const MAX_RECENT = 8;

export interface RecentAppEntry {
	id: string;
	timestamp: number;
}

// --- Standalone functions (non-reactive) ---

export function getFavoriteApps(): string[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY_FAVORITES);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

export function getRecentApps(): RecentAppEntry[] {
	if (typeof window === 'undefined') return [];
	try {
		const stored = localStorage.getItem(STORAGE_KEY_RECENT);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

export function getUsageCounts(): Record<string, number> {
	if (typeof window === 'undefined') return {};
	try {
		const stored = localStorage.getItem(STORAGE_KEY_USAGE);
		return stored ? JSON.parse(stored) : {};
	} catch {
		return {};
	}
}

export function toggleFavoriteApp(appId: string): void {
	if (typeof window === 'undefined') return;
	try {
		const current = getFavoriteApps();
		const index = current.indexOf(appId);
		if (index >= 0) {
			current.splice(index, 1);
		} else {
			current.push(appId);
		}
		localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(current));
	} catch {
		// Ignore storage errors
	}
}

export function recordAppVisit(appId: string): void {
	if (typeof window === 'undefined') return;
	try {
		// Update recent apps
		const recent = getRecentApps();
		const filtered = recent.filter((r) => r.id !== appId);
		const updated = [{ id: appId, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT);
		localStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated));

		// Update usage counts
		const counts = getUsageCounts();
		counts[appId] = (counts[appId] || 0) + 1;
		localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(counts));
	} catch {
		// Ignore storage errors
	}
}

export function clearRecentApps(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(STORAGE_KEY_RECENT);
	} catch {
		// Ignore storage errors
	}
}

// --- Reactive Svelte 5 store ---

export function createAppNavigationStore() {
	let favorites = $state<string[]>(getFavoriteApps());
	let recentApps = $state<RecentAppEntry[]>(getRecentApps());
	let usageCounts = $state<Record<string, number>>(getUsageCounts());

	function refresh() {
		favorites = getFavoriteApps();
		recentApps = getRecentApps();
		usageCounts = getUsageCounts();
	}

	function toggleFavorite(appId: string) {
		toggleFavoriteApp(appId);
		refresh();
	}

	function isFavorite(appId: string): boolean {
		return favorites.includes(appId);
	}

	function visit(appId: string) {
		recordAppVisit(appId);
		refresh();
	}

	function clearRecent() {
		clearRecentApps();
		refresh();
	}

	return {
		get favorites() {
			return favorites;
		},
		get recentApps() {
			return recentApps;
		},
		get usageCounts() {
			return usageCounts;
		},
		toggleFavorite,
		isFavorite,
		recordAppVisit: visit,
		clearRecent,
		refresh,
	};
}
