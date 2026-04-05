/**
 * Cross-App Search — Reactive Svelte 5 Store
 *
 * Wraps the SearchRegistry with debounce, cancellation, and reactive state.
 */

import { SearchRegistry } from './registry';
import type { GroupedSearchResults } from './types';

const DEBOUNCE_MS = 150;

export function createSearchEngine() {
	const registry = new SearchRegistry();

	let query = $state('');
	let results = $state<GroupedSearchResults[]>([]);
	let loading = $state(false);
	let activeFilters = $state<string[]>([]);

	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let abortController: AbortController | undefined;

	function setQuery(q: string) {
		query = q;
		scheduleSearch();
	}

	function toggleFilter(appId: string) {
		if (activeFilters.includes(appId)) {
			activeFilters = activeFilters.filter((id) => id !== appId);
		} else {
			activeFilters = [...activeFilters, appId];
		}
		scheduleSearch();
	}

	function clearFilters() {
		activeFilters = [];
		scheduleSearch();
	}

	function scheduleSearch() {
		clearTimeout(debounceTimer);
		abortController?.abort();

		const q = query.trim();
		if (!q) {
			results = [];
			loading = false;
			return;
		}

		loading = true;
		debounceTimer = setTimeout(() => executeSearch(q), DEBOUNCE_MS);
	}

	async function executeSearch(q: string) {
		abortController = new AbortController();
		const { signal } = abortController;

		try {
			const r = await registry.search(q, {
				appIds: activeFilters.length > 0 ? activeFilters : undefined,
				signal,
			});

			if (!signal.aborted) {
				results = r;
				loading = false;
			}
		} catch {
			if (!signal.aborted) {
				results = [];
				loading = false;
			}
		}
	}

	return {
		registry,
		get query() {
			return query;
		},
		get results() {
			return results;
		},
		get loading() {
			return loading;
		},
		get activeFilters() {
			return activeFilters;
		},
		setQuery,
		toggleFilter,
		clearFilters,
	};
}
