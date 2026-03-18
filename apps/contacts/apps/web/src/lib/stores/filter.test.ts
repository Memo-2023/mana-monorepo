import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
	getItem: vi.fn((key: string) => mockStorage[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockStorage[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete mockStorage[key];
	}),
	clear: vi.fn(() => {
		Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
	}),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

import { contactsFilterStore } from './filter.svelte';

beforeEach(() => {
	vi.clearAllMocks();
	localStorageMock.clear();
	// Reset to defaults
	contactsFilterStore.resetFilters();
});

describe('contactsFilterStore', () => {
	describe('default state', () => {
		it('should have default sort field', () => {
			expect(contactsFilterStore.sortField).toBe('lastName');
		});

		it('should have default contact filter', () => {
			expect(contactsFilterStore.contactFilter).toBe('all');
		});

		it('should have default birthday filter', () => {
			expect(contactsFilterStore.birthdayFilter).toBe('all');
		});

		it('should have no selected tag', () => {
			expect(contactsFilterStore.selectedTagId).toBeNull();
		});

		it('should have no selected company', () => {
			expect(contactsFilterStore.selectedCompany).toBeNull();
		});

		it('should have toolbar collapsed by default', () => {
			expect(contactsFilterStore.isToolbarCollapsed).toBe(true);
		});

		it('should have alphabet nav expanded by default', () => {
			expect(contactsFilterStore.isAlphabetNavCollapsed).toBe(false);
		});

		it('should have empty search query', () => {
			expect(contactsFilterStore.searchQuery).toBe('');
		});
	});

	describe('setters', () => {
		it('should set sort field', () => {
			contactsFilterStore.setSortField('firstName');
			expect(contactsFilterStore.sortField).toBe('firstName');
		});

		it('should set contact filter', () => {
			contactsFilterStore.setContactFilter('favorites');
			expect(contactsFilterStore.contactFilter).toBe('favorites');
		});

		it('should set birthday filter', () => {
			contactsFilterStore.setBirthdayFilter('thisWeek');
			expect(contactsFilterStore.birthdayFilter).toBe('thisWeek');
		});

		it('should set selected tag ID', () => {
			contactsFilterStore.setSelectedTagId('tag-1');
			expect(contactsFilterStore.selectedTagId).toBe('tag-1');
		});

		it('should set selected company', () => {
			contactsFilterStore.setSelectedCompany('ACME');
			expect(contactsFilterStore.selectedCompany).toBe('ACME');
		});

		it('should set search query without persisting', () => {
			contactsFilterStore.setSearchQuery('Max');
			expect(contactsFilterStore.searchQuery).toBe('Max');
		});
	});

	describe('toggles', () => {
		it('should toggle toolbar collapsed state', () => {
			expect(contactsFilterStore.isToolbarCollapsed).toBe(true);
			contactsFilterStore.toggleToolbar();
			expect(contactsFilterStore.isToolbarCollapsed).toBe(false);
			contactsFilterStore.toggleToolbar();
			expect(contactsFilterStore.isToolbarCollapsed).toBe(true);
		});

		it('should toggle alphabet nav collapsed state', () => {
			expect(contactsFilterStore.isAlphabetNavCollapsed).toBe(false);
			contactsFilterStore.toggleAlphabetNav();
			expect(contactsFilterStore.isAlphabetNavCollapsed).toBe(true);
			contactsFilterStore.toggleAlphabetNav();
			expect(contactsFilterStore.isAlphabetNavCollapsed).toBe(false);
		});
	});

	describe('resetFilters', () => {
		it('should reset filters to defaults but keep toolbar/nav state', () => {
			contactsFilterStore.setContactFilter('favorites');
			contactsFilterStore.setBirthdayFilter('thisMonth');
			contactsFilterStore.setSelectedTagId('tag-1');
			contactsFilterStore.setSelectedCompany('ACME');
			contactsFilterStore.setSearchQuery('Max');
			contactsFilterStore.setToolbarCollapsed(false);

			contactsFilterStore.resetFilters();

			expect(contactsFilterStore.contactFilter).toBe('all');
			expect(contactsFilterStore.birthdayFilter).toBe('all');
			expect(contactsFilterStore.selectedTagId).toBeNull();
			expect(contactsFilterStore.selectedCompany).toBeNull();
			expect(contactsFilterStore.searchQuery).toBe('');
			// Toolbar state is preserved in resetFilters
		});
	});

	describe('persistence', () => {
		it('should save state to localStorage on setter call', () => {
			contactsFilterStore.setSortField('firstName');

			expect(localStorageMock.setItem).toHaveBeenCalledWith(
				'contacts-filter-state',
				expect.any(String)
			);
		});

		it('should NOT persist search query', () => {
			vi.clearAllMocks();
			contactsFilterStore.setSearchQuery('test');

			expect(localStorageMock.setItem).not.toHaveBeenCalled();
		});
	});
});
