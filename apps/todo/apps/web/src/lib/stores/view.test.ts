import { describe, it, expect, beforeEach } from 'vitest';
import { viewStore } from './view.svelte';

describe('viewStore filter methods', () => {
	beforeEach(() => {
		viewStore.reset();
	});

	// Filter state defaults
	describe('initial state', () => {
		it('has empty filter priorities', () => {
			expect(viewStore.filterPriorities).toEqual([]);
		});

		it('has empty filter labels', () => {
			expect(viewStore.filterLabelIds).toEqual([]);
		});

		it('has empty filter search query', () => {
			expect(viewStore.filterSearchQuery).toBe('');
		});
	});

	// Setters
	describe('setFilterPriorities', () => {
		it('sets priorities', () => {
			viewStore.setFilterPriorities(['high', 'urgent']);
			expect(viewStore.filterPriorities).toEqual(['high', 'urgent']);
		});

		it('can set to empty array', () => {
			viewStore.setFilterPriorities(['high']);
			viewStore.setFilterPriorities([]);
			expect(viewStore.filterPriorities).toEqual([]);
		});
	});

	describe('setFilterLabelIds', () => {
		it('sets label IDs', () => {
			viewStore.setFilterLabelIds(['label-1', 'label-2']);
			expect(viewStore.filterLabelIds).toEqual(['label-1', 'label-2']);
		});
	});

	describe('setFilterSearchQuery', () => {
		it('sets search query', () => {
			viewStore.setFilterSearchQuery('hello');
			expect(viewStore.filterSearchQuery).toBe('hello');
		});
	});

	// clearFilters
	describe('clearFilters', () => {
		it('resets all filter state', () => {
			viewStore.setFilterPriorities(['urgent']);
			viewStore.setFilterLabelIds(['label-1']);
			viewStore.setFilterSearchQuery('test');

			viewStore.clearFilters();

			expect(viewStore.filterPriorities).toEqual([]);
			expect(viewStore.filterLabelIds).toEqual([]);
			expect(viewStore.filterSearchQuery).toBe('');
		});

		it('does not affect non-filter state', () => {
			viewStore.setSort('priority', 'desc');
			viewStore.toggleShowCompleted();
			viewStore.setFilterPriorities(['high']);

			viewStore.clearFilters();

			expect(viewStore.sortBy).toBe('priority');
			expect(viewStore.sortOrder).toBe('desc');
			expect(viewStore.showCompleted).toBe(true);
		});
	});

	// reset
	describe('reset', () => {
		it('resets filter state along with everything else', () => {
			viewStore.setFilterPriorities(['urgent']);
			viewStore.setSort('title', 'desc');

			viewStore.reset();

			expect(viewStore.filterPriorities).toEqual([]);
			expect(viewStore.sortBy).toBe('order');
			expect(viewStore.sortOrder).toBe('asc');
			expect(viewStore.currentView).toBe('inbox');
		});
	});
});
