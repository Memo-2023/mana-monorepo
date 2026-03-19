import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

import { contactsService, type Contact } from './contacts';

const mockContact = (overrides: Partial<Contact> = {}): Contact => ({
	id: 'c-1',
	userId: 'u-1',
	firstName: 'Max',
	lastName: 'Mustermann',
	email: 'max@example.com',
	isFavorite: false,
	isArchived: false,
	createdAt: '2026-01-01',
	updatedAt: '2026-03-01',
	...overrides,
});

describe('contactsService', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('getDisplayName', () => {
		it('should return displayName when set', () => {
			const contact = mockContact({ displayName: 'Dr. Max' });
			expect(contactsService.getDisplayName(contact)).toBe('Dr. Max');
		});

		it('should return full name from firstName + lastName', () => {
			const contact = mockContact({ displayName: undefined });
			expect(contactsService.getDisplayName(contact)).toBe('Max Mustermann');
		});

		it('should return firstName only when lastName is missing', () => {
			const contact = mockContact({ displayName: undefined, lastName: undefined });
			expect(contactsService.getDisplayName(contact)).toBe('Max');
		});

		it('should return lastName only when firstName is missing', () => {
			const contact = mockContact({
				displayName: undefined,
				firstName: undefined,
				lastName: 'Mustermann',
			});
			expect(contactsService.getDisplayName(contact)).toBe('Mustermann');
		});

		it('should return email when no name is available', () => {
			const contact = mockContact({
				displayName: undefined,
				firstName: undefined,
				lastName: undefined,
				email: 'max@example.com',
			});
			expect(contactsService.getDisplayName(contact)).toBe('max@example.com');
		});

		it('should return Unknown when nothing is available', () => {
			const contact = mockContact({
				displayName: undefined,
				firstName: undefined,
				lastName: undefined,
				email: undefined,
			});
			expect(contactsService.getDisplayName(contact)).toBe('Unknown');
		});
	});

	describe('getFavoriteContacts', () => {
		it('should fetch favorite contacts', async () => {
			const favorites = [mockContact({ isFavorite: true })];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ contacts: favorites, total: 1 }),
			});

			const result = await contactsService.getFavoriteContacts();

			expect(result.data).toEqual(favorites);
			expect(result.error).toBeNull();
			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/contacts?isFavorite=true&limit=5'),
				expect.any(Object)
			);
		});

		it('should respect custom limit', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ contacts: [], total: 0 }),
			});

			await contactsService.getFavoriteContacts(10);

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('limit=10'),
				expect.any(Object)
			);
		});

		it('should return empty array when no contacts', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ contacts: [], total: 0 }),
			});

			const result = await contactsService.getFavoriteContacts();

			expect(result.data).toEqual([]);
		});
	});

	describe('getRecentContacts', () => {
		it('should sort by updatedAt and filter archived', async () => {
			const contacts = [
				mockContact({ id: 'c-1', updatedAt: '2026-01-01', isArchived: false }),
				mockContact({ id: 'c-2', updatedAt: '2026-03-01', isArchived: false }),
				mockContact({ id: 'c-3', updatedAt: '2026-02-01', isArchived: true }),
			];
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ contacts, total: 3 }),
			});

			const result = await contactsService.getRecentContacts(5);

			expect(result.data).toHaveLength(2);
			expect(result.data![0].id).toBe('c-2'); // Most recent first
			expect(result.data![1].id).toBe('c-1');
		});
	});
});
