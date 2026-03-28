import { browser } from '$app/environment';
import type { ViewMode, SortOption, FilterCriteria, SavedFilter } from '@taktik/shared';

const VIEW_KEY = 'taktik_view_mode';
const SORT_KEY = 'taktik_sort';
const FILTERS_KEY = 'taktik_saved_filters';

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
	localStorage.setItem(key, JSON.stringify(value));
}

let viewMode = $state<ViewMode>('week');
let sort = $state<SortOption>({ field: 'date', direction: 'desc' });
let activeFilters = $state<FilterCriteria>({});
let savedFilters = $state<SavedFilter[]>([]);
let initialized = $state(false);

export const viewStore = {
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
		return !!(
			activeFilters.search ||
			activeFilters.projectId ||
			activeFilters.clientId ||
			activeFilters.tagIds?.length ||
			activeFilters.isBillable !== undefined ||
			activeFilters.dateFrom ||
			activeFilters.dateTo
		);
	},

	initialize() {
		if (initialized) return;
		viewMode = load<ViewMode>(VIEW_KEY, 'week');
		sort = load<SortOption>(SORT_KEY, { field: 'date', direction: 'desc' });
		savedFilters = load<SavedFilter[]>(FILTERS_KEY, []);
		initialized = true;
	},

	setViewMode(mode: ViewMode) {
		viewMode = mode;
		save(VIEW_KEY, mode);
	},

	setSort(newSort: SortOption) {
		sort = newSort;
		save(SORT_KEY, newSort);
	},

	setFilters(filters: FilterCriteria) {
		activeFilters = filters;
	},

	updateFilter<K extends keyof FilterCriteria>(key: K, value: FilterCriteria[K]) {
		activeFilters = { ...activeFilters, [key]: value };
	},

	clearFilters() {
		activeFilters = {};
	},

	saveFilter(name: string) {
		const filter: SavedFilter = {
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
