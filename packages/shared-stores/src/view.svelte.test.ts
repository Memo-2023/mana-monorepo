import { describe, it, expect, beforeEach, vi } from 'vitest';

// Must dynamically import to get fresh $state per test
async function freshStore() {
	vi.resetModules();
	const mod = await import('./view.svelte');
	return mod.createViewStore;
}

type TestViewMode = 'list' | 'grid' | 'table';

interface TestFilters {
	search?: string;
	tagIds?: string[];
	status?: string[];
}

beforeEach(() => {
	localStorage.clear();
});

describe('createViewStore', () => {
	describe('defaults', () => {
		it('initializes with default view mode', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			expect(store.viewMode).toBe('list');
		});

		it('initializes with default sort', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			expect(store.sort).toEqual({ field: 'name', direction: 'asc' });
		});

		it('starts with empty filters', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			expect(store.activeFilters).toEqual({});
		});

		it('starts with empty saved filters', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			expect(store.savedFilters).toEqual([]);
		});
	});

	describe('viewMode', () => {
		it('updates view mode', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setViewMode('grid');
			expect(store.viewMode).toBe('grid');
		});

		it('persists view mode to localStorage', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setViewMode('table');
			expect(JSON.parse(localStorage.getItem('test_view_mode')!)).toBe('table');
		});
	});

	describe('sort', () => {
		it('updates sort', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setSort({ field: 'date', direction: 'desc' });
			expect(store.sort).toEqual({ field: 'date', direction: 'desc' });
		});

		it('persists sort to localStorage', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setSort({ field: 'date', direction: 'desc' });
			expect(JSON.parse(localStorage.getItem('test_sort')!)).toEqual({
				field: 'date',
				direction: 'desc',
			});
		});
	});

	describe('filters', () => {
		it('sets filters', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello', tagIds: ['t1'] });
			expect(store.activeFilters).toEqual({ search: 'hello', tagIds: ['t1'] });
		});

		it('updates a single filter key', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello' });
			store.updateFilter('tagIds', ['t1', 't2']);
			expect(store.activeFilters).toEqual({ search: 'hello', tagIds: ['t1', 't2'] });
		});

		it('clears all filters', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello', tagIds: ['t1'] });
			store.clearFilters();
			expect(store.activeFilters).toEqual({});
		});
	});

	describe('hasActiveFilters', () => {
		it('returns false when no filters are set', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			expect(store.hasActiveFilters).toBe(false);
		});

		it('uses default heuristic when no custom fn provided', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello' });
			expect(store.hasActiveFilters).toBe(true);
		});

		it('ignores empty arrays in default heuristic', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ tagIds: [] });
			expect(store.hasActiveFilters).toBe(false);
		});

		it('uses custom hasActiveFilters function', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
				hasActiveFilters: (f) => !!f.search,
			});
			store.setFilters({ tagIds: ['t1'] });
			expect(store.hasActiveFilters).toBe(false);
			store.setFilters({ search: 'x' });
			expect(store.hasActiveFilters).toBe(true);
		});
	});

	describe('saved filters', () => {
		it('saves a named filter preset', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello' });
			store.saveFilter('My Filter');
			expect(store.savedFilters).toHaveLength(1);
			expect(store.savedFilters[0].name).toBe('My Filter');
			expect(store.savedFilters[0].criteria).toEqual({ search: 'hello' });
		});

		it('persists saved filters to localStorage', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello' });
			store.saveFilter('My Filter');
			const stored = JSON.parse(localStorage.getItem('test_saved_filters')!);
			expect(stored).toHaveLength(1);
			expect(stored[0].name).toBe('My Filter');
		});

		it('loads a saved filter', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello' });
			store.saveFilter('My Filter');
			store.clearFilters();
			expect(store.activeFilters).toEqual({});
			store.loadFilter(store.savedFilters[0].id);
			expect(store.activeFilters).toEqual({ search: 'hello' });
		});

		it('deletes a saved filter', async () => {
			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.setFilters({ search: 'hello' });
			store.saveFilter('Filter 1');
			store.saveFilter('Filter 2');
			expect(store.savedFilters).toHaveLength(2);
			store.deleteSavedFilter(store.savedFilters[0].id);
			expect(store.savedFilters).toHaveLength(1);
			expect(store.savedFilters[0].name).toBe('Filter 2');
		});
	});

	describe('initialize', () => {
		it('loads persisted view mode from localStorage', async () => {
			localStorage.setItem('test_view_mode', JSON.stringify('grid'));
			localStorage.setItem('test_sort', JSON.stringify({ field: 'date', direction: 'desc' }));

			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.initialize();
			expect(store.viewMode).toBe('grid');
			expect(store.sort).toEqual({ field: 'date', direction: 'desc' });
		});

		it('only initializes once', async () => {
			localStorage.setItem('test_view_mode', JSON.stringify('grid'));

			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.initialize();
			expect(store.viewMode).toBe('grid');

			// Change localStorage directly — second initialize should be no-op
			localStorage.setItem('test_view_mode', JSON.stringify('table'));
			store.initialize();
			expect(store.viewMode).toBe('grid');
		});

		it('loads persisted saved filters', async () => {
			localStorage.setItem(
				'test_saved_filters',
				JSON.stringify([
					{ id: 'f1', name: 'Preset', criteria: { search: 'test' }, createdAt: '2024-01-01' },
				])
			);

			const createViewStore = await freshStore();
			const store = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'test',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			store.initialize();
			expect(store.savedFilters).toHaveLength(1);
			expect(store.savedFilters[0].name).toBe('Preset');
		});
	});

	describe('storage prefix isolation', () => {
		it('uses different localStorage keys per prefix', async () => {
			const createViewStore = await freshStore();
			const store1 = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'app1',
				defaultViewMode: 'list',
				defaultSort: { field: 'name', direction: 'asc' },
			});
			const _store2 = createViewStore<TestViewMode, TestFilters>({
				storagePrefix: 'app2',
				defaultViewMode: 'grid',
				defaultSort: { field: 'date', direction: 'desc' },
			});

			store1.setViewMode('table');
			expect(JSON.parse(localStorage.getItem('app1_view_mode')!)).toBe('table');
			expect(localStorage.getItem('app2_view_mode')).toBeNull();
		});
	});
});
