/**
 * View Store Factory
 *
 * Creates a type-safe view/filter/sort store with localStorage persistence.
 * Replaces ~110 LOC boilerplate per module.
 *
 * @example
 * ```typescript
 * import { createViewStore } from '@mana/shared-stores';
 *
 * type MyViewMode = 'list' | 'grid' | 'kanban';
 *
 * interface MyFilters {
 *   search?: string;
 *   status?: string[];
 *   tagIds?: string[];
 * }
 *
 * export const viewStore = createViewStore<MyViewMode, MyFilters>({
 *   storagePrefix: 'inventar',
 *   defaultViewMode: 'list',
 *   defaultSort: { field: 'name', direction: 'asc' },
 *   hasActiveFilters: (f) => !!(f.search || f.status?.length || f.tagIds?.length),
 * });
 * ```
 */

import { browser } from '$app/environment';

export interface SortOption {
	field: string;
	direction: 'asc' | 'desc';
}

export interface SavedFilter<F> {
	id: string;
	name: string;
	criteria: F;
	createdAt: string;
}

export interface ViewStoreConfig<V extends string, F extends object> {
	/** Prefix for localStorage keys (e.g. 'inventar' → 'inventar_view_mode') */
	storagePrefix: string;
	/** Default view mode */
	defaultViewMode: V;
	/** Default sort option */
	defaultSort: SortOption;
	/** Returns true if any filters are active (used for UI indicators) */
	hasActiveFilters?: (filters: F) => boolean;
}

export interface ViewStore<V extends string, F extends object> {
	readonly viewMode: V;
	readonly sort: SortOption;
	readonly activeFilters: F;
	readonly savedFilters: SavedFilter<F>[];
	readonly hasActiveFilters: boolean;

	initialize(): void;
	setViewMode(mode: V): void;
	setSort(newSort: SortOption): void;
	setFilters(filters: F): void;
	updateFilter<K extends keyof F>(key: K, value: F[K]): void;
	clearFilters(): void;
	saveFilter(name: string): void;
	loadFilter(id: string): void;
	deleteSavedFilter(id: string): void;
}

function load<T>(key: string, fallback: T): T {
	if (!browser) return fallback;
	try {
		const data = localStorage.getItem(key);
		return data ? JSON.parse(data) : fallback;
	} catch {
		return fallback;
	}
}

function save(key: string, value: unknown) {
	if (!browser) return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Silently fail (quota exceeded, private mode, etc.)
	}
}

export function createViewStore<V extends string, F extends object>(
	config: ViewStoreConfig<V, F>
): ViewStore<V, F> {
	const VIEW_KEY = `${config.storagePrefix}_view_mode`;
	const SORT_KEY = `${config.storagePrefix}_sort`;
	const FILTERS_KEY = `${config.storagePrefix}_saved_filters`;

	let viewMode = $state<V>(config.defaultViewMode);
	let sort = $state<SortOption>(config.defaultSort);
	let activeFilters = $state<F>({} as F);
	let savedFilters = $state<SavedFilter<F>[]>([]);
	let initialized = $state(false);

	return {
		get viewMode() {
			return viewMode;
		},
		get sort() {
			return sort;
		},
		get activeFilters() {
			return activeFilters;
		},
		get savedFilters() {
			return savedFilters;
		},
		get hasActiveFilters() {
			if (config.hasActiveFilters) return config.hasActiveFilters(activeFilters);
			return Object.values(activeFilters).some(
				(v) => v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0)
			);
		},

		initialize() {
			if (initialized) return;
			viewMode = load<V>(VIEW_KEY, config.defaultViewMode);
			sort = load<SortOption>(SORT_KEY, config.defaultSort);
			savedFilters = load<SavedFilter<F>[]>(FILTERS_KEY, []);
			initialized = true;
		},

		setViewMode(mode: V) {
			viewMode = mode;
			save(VIEW_KEY, mode);
		},

		setSort(newSort: SortOption) {
			sort = newSort;
			save(SORT_KEY, newSort);
		},

		setFilters(filters: F) {
			activeFilters = filters;
		},

		updateFilter<K extends keyof F>(key: K, value: F[K]) {
			activeFilters = { ...activeFilters, [key]: value };
		},

		clearFilters() {
			activeFilters = {} as F;
		},

		saveFilter(name: string) {
			const filter: SavedFilter<F> = {
				id: crypto.randomUUID(),
				name,
				criteria: { ...activeFilters },
				createdAt: new Date().toISOString(),
			};
			savedFilters = [...savedFilters, filter];
			save(FILTERS_KEY, savedFilters);
		},

		loadFilter(id: string) {
			const filter = savedFilters.find((f) => f.id === id);
			if (filter) {
				activeFilters = { ...filter.criteria };
			}
		},

		deleteSavedFilter(id: string) {
			savedFilters = savedFilters.filter((f) => f.id !== id);
			save(FILTERS_KEY, savedFilters);
		},
	};
}
