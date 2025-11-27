/**
 * Example SvelteKit Server Load Function Test
 *
 * This demonstrates best practices for testing SvelteKit server functions:
 * - Test load functions
 * - Test form actions
 * - Mock database/API calls
 * - Test error handling
 * - Test redirects
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { load, actions } from '../+page.server';
import { redirect } from '@sveltejs/kit';

// Mock dependencies
vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			users: {
				findMany: vi.fn(),
				findUnique: vi.fn(),
				create: vi.fn(),
				update: vi.fn(),
				delete: vi.fn(),
			},
		},
	},
}));

vi.mock('@sveltejs/kit', async () => {
	const actual = await vi.importActual('@sveltejs/kit');
	return {
		...actual,
		redirect: vi.fn((status, location) => {
			throw new Error(`Redirect: ${status} ${location}`);
		}),
	};
});

describe('Dashboard Server Load Function', () => {
	let mockLocals: any;
	let mockEvent: Partial<RequestEvent>;

	beforeEach(() => {
		vi.clearAllMocks();

		mockLocals = {
			user: {
				id: 'user-123',
				email: 'test@example.com',
			},
			pb: {
				collection: vi.fn(() => ({
					getList: vi.fn(),
					getOne: vi.fn(),
					create: vi.fn(),
					update: vi.fn(),
					delete: vi.fn(),
				})),
			},
		};

		mockEvent = {
			locals: mockLocals,
			params: {},
			url: new URL('http://localhost:5173/dashboard'),
		};
	});

	describe('load function', () => {
		it('should load user data successfully', async () => {
			// Arrange
			const mockItems = [
				{ id: '1', title: 'Item 1', createdAt: new Date() },
				{ id: '2', title: 'Item 2', createdAt: new Date() },
			];

			mockLocals.pb.collection().getList.mockResolvedValue({
				items: mockItems,
				totalItems: 2,
				page: 1,
				totalPages: 1,
			});

			// Act
			const result = await load(mockEvent as RequestEvent);

			// Assert
			expect(result.items).toHaveLength(2);
			expect(result.items).toEqual(mockItems);
			expect(mockLocals.pb.collection).toHaveBeenCalledWith('items');
		});

		it('should handle empty results', async () => {
			// Arrange
			mockLocals.pb.collection().getList.mockResolvedValue({
				items: [],
				totalItems: 0,
				page: 1,
				totalPages: 0,
			});

			// Act
			const result = await load(mockEvent as RequestEvent);

			// Assert
			expect(result.items).toEqual([]);
		});

		it('should redirect when user is not authenticated', async () => {
			// Arrange
			mockEvent.locals = { user: null };

			// Act & Assert
			await expect(load(mockEvent as RequestEvent)).rejects.toThrow('Redirect: 302 /signin');
		});

		it('should handle database errors', async () => {
			// Arrange
			mockLocals.pb.collection().getList.mockRejectedValue(new Error('Database connection failed'));

			// Act & Assert
			await expect(load(mockEvent as RequestEvent)).rejects.toThrow('Database connection failed');
		});

		it('should filter items by user', async () => {
			// Arrange
			const mockItems = [{ id: '1', title: 'Item 1', userId: 'user-123' }];

			mockLocals.pb.collection().getList.mockResolvedValue({
				items: mockItems,
			});

			// Act
			await load(mockEvent as RequestEvent);

			// Assert
			expect(mockLocals.pb.collection().getList).toHaveBeenCalledWith(
				1,
				20,
				expect.objectContaining({
					filter: expect.stringContaining('user-123'),
				})
			);
		});

		it('should handle pagination parameters', async () => {
			// Arrange
			mockEvent.url = new URL('http://localhost:5173/dashboard?page=2');

			mockLocals.pb.collection().getList.mockResolvedValue({
				items: [],
				page: 2,
			});

			// Act
			await load(mockEvent as RequestEvent);

			// Assert
			expect(mockLocals.pb.collection().getList).toHaveBeenCalledWith(
				2, // page
				20, // perPage
				expect.any(Object)
			);
		});

		it('should load related data efficiently', async () => {
			// Arrange
			const mockItems = [{ id: '1', categoryId: 'cat-1' }];
			const mockCategories = [{ id: 'cat-1', name: 'Category 1' }];

			mockLocals.pb.collection('items').getList.mockResolvedValue({ items: mockItems });
			mockLocals.pb.collection('categories').getList.mockResolvedValue({ items: mockCategories });

			// Act
			const result = await load(mockEvent as RequestEvent);

			// Assert
			expect(result.items).toBeDefined();
			expect(result.categories).toBeDefined();
			// Should only make 2 DB calls (not N+1)
			expect(mockLocals.pb.collection).toHaveBeenCalledTimes(2);
		});
	});

	describe('form actions', () => {
		describe('create', () => {
			it('should create item successfully', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('title', 'New Item');
				formData.append('description', 'Description');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				const mockCreatedItem = {
					id: 'item-123',
					title: 'New Item',
					description: 'Description',
				};

				mockLocals.pb.collection().create.mockResolvedValue(mockCreatedItem);

				// Act
				const result = await actions.create(mockEvent as RequestEvent);

				// Assert
				expect(result).toMatchObject({
					success: true,
					item: mockCreatedItem,
				});
				expect(mockLocals.pb.collection().create).toHaveBeenCalledWith(
					expect.objectContaining({
						title: 'New Item',
						userId: 'user-123',
					})
				);
			});

			it('should validate required fields', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('title', ''); // Empty title

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				// Act
				const result = await actions.create(mockEvent as RequestEvent);

				// Assert
				expect(result).toMatchObject({
					success: false,
					error: expect.stringContaining('Title is required'),
				});
				expect(mockLocals.pb.collection().create).not.toHaveBeenCalled();
			});

			it('should sanitize input data', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('title', '<script>alert("xss")</script>');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().create.mockResolvedValue({
					id: '1',
					title: 'alert("xss")', // Sanitized
				});

				// Act
				await actions.create(mockEvent as RequestEvent);

				// Assert
				expect(mockLocals.pb.collection().create).toHaveBeenCalledWith(
					expect.objectContaining({
						title: expect.not.stringContaining('<script>'),
					})
				);
			});

			it('should handle database errors', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('title', 'Test');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().create.mockRejectedValue(new Error('Database error'));

				// Act
				const result = await actions.create(mockEvent as RequestEvent);

				// Assert
				expect(result).toMatchObject({
					success: false,
					error: expect.any(String),
				});
			});

			it('should handle file uploads', async () => {
				// Arrange
				const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
				const formData = new FormData();
				formData.append('title', 'Image Post');
				formData.append('image', file);

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().create.mockResolvedValue({
					id: '1',
					title: 'Image Post',
					image: 'uploads/test.jpg',
				});

				// Act
				const result = await actions.create(mockEvent as RequestEvent);

				// Assert
				expect(result.success).toBe(true);
				expect(mockLocals.pb.collection().create).toHaveBeenCalledWith(
					expect.objectContaining({
						image: expect.any(File),
					})
				);
			});
		});

		describe('update', () => {
			it('should update item successfully', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('id', 'item-123');
				formData.append('title', 'Updated Title');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().getOne.mockResolvedValue({
					id: 'item-123',
					userId: 'user-123',
				});

				mockLocals.pb.collection().update.mockResolvedValue({
					id: 'item-123',
					title: 'Updated Title',
				});

				// Act
				const result = await actions.update(mockEvent as RequestEvent);

				// Assert
				expect(result.success).toBe(true);
				expect(mockLocals.pb.collection().update).toHaveBeenCalled();
			});

			it('should not allow updating other users items', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('id', 'item-123');
				formData.append('title', 'Hacked');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().getOne.mockResolvedValue({
					id: 'item-123',
					userId: 'other-user', // Different user
				});

				// Act
				const result = await actions.update(mockEvent as RequestEvent);

				// Assert
				expect(result.success).toBe(false);
				expect(result.error).toContain('Unauthorized');
				expect(mockLocals.pb.collection().update).not.toHaveBeenCalled();
			});
		});

		describe('delete', () => {
			it('should delete item successfully', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('id', 'item-123');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().getOne.mockResolvedValue({
					id: 'item-123',
					userId: 'user-123',
				});

				mockLocals.pb.collection().delete.mockResolvedValue(true);

				// Act
				const result = await actions.delete(mockEvent as RequestEvent);

				// Assert
				expect(result.success).toBe(true);
				expect(mockLocals.pb.collection().delete).toHaveBeenCalledWith('item-123');
			});

			it('should not allow deleting other users items', async () => {
				// Arrange
				const formData = new FormData();
				formData.append('id', 'item-123');

				mockEvent.request = {
					formData: async () => formData,
				} as Request;

				mockLocals.pb.collection().getOne.mockResolvedValue({
					id: 'item-123',
					userId: 'other-user',
				});

				// Act
				const result = await actions.delete(mockEvent as RequestEvent);

				// Assert
				expect(result.success).toBe(false);
				expect(mockLocals.pb.collection().delete).not.toHaveBeenCalled();
			});
		});
	});
});
