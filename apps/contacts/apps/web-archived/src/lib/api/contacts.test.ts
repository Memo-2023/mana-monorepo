import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the client module
vi.mock('./client', () => ({
	fetchWithAuth: vi.fn(),
	fetchWithAuthFormData: vi.fn(),
}));

// Mock $app/environment
vi.mock('$app/environment', () => ({
	browser: true,
}));

// Mock auth store
vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('mock-token'),
		getValidToken: vi.fn().mockResolvedValue('mock-token'),
	},
}));

// Mock shared-tags
vi.mock('@manacore/shared-tags', () => ({
	createTagsClient: vi.fn(() => ({
		getAll: vi.fn().mockResolvedValue([]),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		createDefaults: vi.fn().mockResolvedValue([]),
	})),
}));

import { contactsApi, notesApi, activitiesApi } from './contacts';
import { fetchWithAuth } from './client';

const mockFetch = vi.mocked(fetchWithAuth);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('contactsApi', () => {
	describe('list', () => {
		it('should fetch contacts without filters', async () => {
			mockFetch.mockResolvedValue({ contacts: [], total: 0 });

			const result = await contactsApi.list();

			expect(mockFetch).toHaveBeenCalledWith('/contacts');
			expect(result).toEqual({ contacts: [], total: 0 });
		});

		it('should build query string with search filter', async () => {
			mockFetch.mockResolvedValue({ contacts: [], total: 0 });

			await contactsApi.list({ search: 'Max' });

			expect(mockFetch).toHaveBeenCalledWith('/contacts?search=Max');
		});

		it('should build query string with multiple filters', async () => {
			mockFetch.mockResolvedValue({ contacts: [], total: 0 });

			await contactsApi.list({
				search: 'Max',
				isFavorite: true,
				limit: 50,
				offset: 10,
			});

			const callArg = mockFetch.mock.calls[0][0];
			expect(callArg).toContain('search=Max');
			expect(callArg).toContain('isFavorite=true');
			expect(callArg).toContain('limit=50');
			expect(callArg).toContain('offset=10');
		});

		it('should include tagId filter', async () => {
			mockFetch.mockResolvedValue({ contacts: [], total: 0 });

			await contactsApi.list({ tagId: 'tag-123' });

			expect(mockFetch).toHaveBeenCalledWith('/contacts?tagId=tag-123');
		});

		it('should include isArchived filter', async () => {
			mockFetch.mockResolvedValue({ contacts: [], total: 0 });

			await contactsApi.list({ isArchived: true });

			expect(mockFetch).toHaveBeenCalledWith('/contacts?isArchived=true');
		});
	});

	describe('get', () => {
		it('should fetch a single contact', async () => {
			const contact = { id: 'c1', firstName: 'Max' };
			mockFetch.mockResolvedValue({ contact });

			const result = await contactsApi.get('c1');

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1');
			expect(result).toEqual(contact);
		});
	});

	describe('create', () => {
		it('should POST new contact', async () => {
			const contact = { id: 'c1', firstName: 'Max' };
			mockFetch.mockResolvedValue({ contact });

			const result = await contactsApi.create({ firstName: 'Max' });

			expect(mockFetch).toHaveBeenCalledWith('/contacts', {
				method: 'POST',
				body: JSON.stringify({ firstName: 'Max' }),
			});
			expect(result).toEqual(contact);
		});
	});

	describe('update', () => {
		it('should PATCH existing contact', async () => {
			const contact = { id: 'c1', firstName: 'Maximilian' };
			mockFetch.mockResolvedValue({ contact });

			const result = await contactsApi.update('c1', { firstName: 'Maximilian' });

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1', {
				method: 'PATCH',
				body: JSON.stringify({ firstName: 'Maximilian' }),
			});
			expect(result).toEqual(contact);
		});
	});

	describe('delete', () => {
		it('should DELETE contact', async () => {
			mockFetch.mockResolvedValue(undefined);

			await contactsApi.delete('c1');

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1', {
				method: 'DELETE',
			});
		});
	});

	describe('toggleFavorite', () => {
		it('should POST to favorite endpoint', async () => {
			const contact = { id: 'c1', isFavorite: true };
			mockFetch.mockResolvedValue({ contact });

			const result = await contactsApi.toggleFavorite('c1');

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/favorite', {
				method: 'POST',
			});
			expect(result).toEqual(contact);
		});
	});

	describe('toggleArchive', () => {
		it('should POST to archive endpoint', async () => {
			const contact = { id: 'c1', isArchived: true };
			mockFetch.mockResolvedValue({ contact });

			const result = await contactsApi.toggleArchive('c1');

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/archive', {
				method: 'POST',
			});
			expect(result).toEqual(contact);
		});
	});
});

describe('notesApi', () => {
	describe('list', () => {
		it('should fetch notes for a contact', async () => {
			mockFetch.mockResolvedValue({ notes: [] });

			const result = await notesApi.list('c1');

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/notes');
			expect(result).toEqual({ notes: [] });
		});
	});

	describe('create', () => {
		it('should POST a new note', async () => {
			const note = { id: 'n1', content: 'Test note' };
			mockFetch.mockResolvedValue({ note });

			const result = await notesApi.create('c1', { content: 'Test note' });

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/notes', {
				method: 'POST',
				body: JSON.stringify({ content: 'Test note' }),
			});
			expect(result).toEqual({ note });
		});
	});

	describe('update', () => {
		it('should PATCH a note', async () => {
			const note = { id: 'n1', content: 'Updated' };
			mockFetch.mockResolvedValue({ note });

			const result = await notesApi.update('n1', { content: 'Updated' });

			expect(mockFetch).toHaveBeenCalledWith('/notes/n1', {
				method: 'PATCH',
				body: JSON.stringify({ content: 'Updated' }),
			});
			expect(result).toEqual({ note });
		});
	});

	describe('delete', () => {
		it('should DELETE a note', async () => {
			mockFetch.mockResolvedValue(undefined);

			await notesApi.delete('n1');

			expect(mockFetch).toHaveBeenCalledWith('/notes/n1', {
				method: 'DELETE',
			});
		});
	});

	describe('togglePin', () => {
		it('should POST to pin endpoint', async () => {
			const note = { id: 'n1', isPinned: true };
			mockFetch.mockResolvedValue({ note });

			const result = await notesApi.togglePin('n1');

			expect(mockFetch).toHaveBeenCalledWith('/notes/n1/pin', {
				method: 'POST',
			});
			expect(result).toEqual({ note });
		});
	});
});

describe('activitiesApi', () => {
	describe('list', () => {
		it('should fetch activities for a contact', async () => {
			mockFetch.mockResolvedValue({ activities: [] });

			const result = await activitiesApi.list('c1');

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/activities');
			expect(result).toEqual({ activities: [] });
		});

		it('should include limit parameter', async () => {
			mockFetch.mockResolvedValue({ activities: [] });

			await activitiesApi.list('c1', 10);

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/activities?limit=10');
		});
	});

	describe('create', () => {
		it('should POST a new activity', async () => {
			const activity = { id: 'a1', activityType: 'called' };
			mockFetch.mockResolvedValue({ activity });

			const result = await activitiesApi.create('c1', {
				activityType: 'called',
				description: 'Called about project',
			});

			expect(mockFetch).toHaveBeenCalledWith('/contacts/c1/activities', {
				method: 'POST',
				body: JSON.stringify({
					activityType: 'called',
					description: 'Called about project',
				}),
			});
			expect(result).toEqual({ activity });
		});
	});
});
