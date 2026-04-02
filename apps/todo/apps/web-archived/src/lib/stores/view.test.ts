import { describe, it, expect, beforeEach } from 'vitest';
import { viewStore } from './view.svelte';

describe('viewStore', () => {
	beforeEach(() => {
		viewStore.reset();
	});

	describe('reset', () => {
		it('resets all state to defaults', () => {
			viewStore.setSort('title', 'desc');
			viewStore.toggleShowCompleted();

			viewStore.reset();

			expect(viewStore.sortBy).toBe('order');
			expect(viewStore.sortOrder).toBe('asc');
			expect(viewStore.showCompleted).toBe(false);
			expect(viewStore.currentView).toBe('inbox');
		});
	});

	describe('sort', () => {
		it('sets sort options', () => {
			viewStore.setSort('priority', 'desc');
			expect(viewStore.sortBy).toBe('priority');
			expect(viewStore.sortOrder).toBe('desc');
		});

		it('toggles sort order', () => {
			viewStore.toggleSortOrder();
			expect(viewStore.sortOrder).toBe('desc');
			viewStore.toggleSortOrder();
			expect(viewStore.sortOrder).toBe('asc');
		});
	});

	describe('showCompleted', () => {
		it('toggles show completed', () => {
			expect(viewStore.showCompleted).toBe(false);
			viewStore.toggleShowCompleted();
			expect(viewStore.showCompleted).toBe(true);
		});
	});
});
