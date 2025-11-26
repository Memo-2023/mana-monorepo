import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fail } from '@sveltejs/kit';
import * as actions from './+page.server';
import { pb, generateTagSlug, DEFAULT_TAG_COLORS } from '$lib/pocketbase';
import { createTestTag, createTestUser } from '$tests/factories';

// Mock @sveltejs/kit
vi.mock('@sveltejs/kit', () => ({
	fail: vi.fn((status, data) => ({ status, data }))
}));

// Mock PocketBase
vi.mock('$lib/pocketbase', () => ({
	pb: {
		collection: vi.fn()
	},
	generateTagSlug: vi.fn((name) => name.toLowerCase().replace(/\s+/g, '-')),
	DEFAULT_TAG_COLORS: ['#3B82F6', '#EF4444', '#10B981']
}));

describe('Tags Page Server Actions', () => {
	let mockCollection: any;
	let testUser: any;

	beforeEach(() => {
		vi.clearAllMocks();

		testUser = createTestUser({
			id: 'user123',
			email: 'test@example.com'
		});

		// Setup mock collection methods
		mockCollection = {
			getList: vi.fn(),
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn()
		};

		(pb.collection as any).mockReturnValue(mockCollection);
	});

	describe('load function', () => {
		it('should load tags for authenticated user', async () => {
			const mockTags = [
				createTestTag({ id: 'tag1', name: 'Work', user_id: 'user123' }),
				createTestTag({ id: 'tag2', name: 'Personal', user_id: 'user123' })
			];

			mockCollection.getList
				.mockResolvedValueOnce({
					items: mockTags,
					totalItems: 2
				})
				.mockResolvedValue({
					items: [],
					totalItems: 0
				});

			const result = await actions.load({
				locals: { user: testUser }
			} as any);

			expect(mockCollection.getList).toHaveBeenCalledWith(1, 100, {
				filter: `user_id="user123"`,
				sort: '-usage_count,name'
			});

			expect(result.tags).toHaveLength(2);
			expect(result.tags[0]).toHaveProperty('linkCount', 0);
		});

		it('should return empty array on error', async () => {
			mockCollection.getList.mockRejectedValue(new Error('Database error'));

			const result = await actions.load({
				locals: { user: testUser }
			} as any);

			expect(result.tags).toEqual([]);
		});

		it('should include link counts for each tag', async () => {
			const mockTag = createTestTag({ id: 'tag1', name: 'Work', user_id: 'user123' });

			mockCollection.getList
				.mockResolvedValueOnce({
					items: [mockTag],
					totalItems: 1
				})
				.mockResolvedValueOnce({
					items: [],
					totalItems: 5 // 5 links using this tag
				});

			const result = await actions.load({
				locals: { user: testUser }
			} as any);

			expect(result.tags[0].linkCount).toBe(5);
		});
	});

	describe('create action', () => {
		it('should create a new tag successfully', async () => {
			const formData = new FormData();
			formData.append('name', 'New Tag');
			formData.append('color', '#3B82F6');
			formData.append('icon', '🏷️');
			formData.append('is_public', 'on');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			const expectedTag = {
				id: 'new-tag-id',
				name: 'New Tag',
				slug: 'new-tag',
				color: '#3B82F6',
				icon: '🏷️',
				user_id: 'user123',
				is_public: true,
				usage_count: 0
			};

			mockCollection.create.mockResolvedValue(expectedTag);

			const result = await actions.actions.create({
				request: mockRequest,
				locals: { user: testUser }
			} as any);

			expect(mockCollection.create).toHaveBeenCalledWith({
				name: 'New Tag',
				slug: 'new-tag',
				color: '#3B82F6',
				icon: '🏷️',
				user_id: 'user123',
				is_public: true,
				usage_count: 0
			});

			expect(result).toEqual({ success: true, tag: expectedTag });
		});

		it('should trim tag name', async () => {
			const formData = new FormData();
			formData.append('name', '  Trimmed Tag  ');
			formData.append('color', '#3B82F6');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.create.mockResolvedValue({ id: 'tag-id' });

			await actions.actions.create({
				request: mockRequest,
				locals: { user: testUser }
			} as any);

			expect(mockCollection.create).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Trimmed Tag',
					slug: 'trimmed-tag'
				})
			);
		});

		it('should use default color if not provided', async () => {
			const formData = new FormData();
			formData.append('name', 'Tag');
			formData.append('color', '');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.create.mockResolvedValue({ id: 'tag-id' });

			await actions.actions.create({
				request: mockRequest,
				locals: { user: testUser }
			} as any);

			expect(mockCollection.create).toHaveBeenCalledWith(
				expect.objectContaining({
					color: DEFAULT_TAG_COLORS[0]
				})
			);
		});

		it('should handle is_public correctly', async () => {
			const formData = new FormData();
			formData.append('name', 'Private Tag');
			// is_public not set (checkbox unchecked)

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.create.mockResolvedValue({ id: 'tag-id' });

			await actions.actions.create({
				request: mockRequest,
				locals: { user: testUser }
			} as any);

			expect(mockCollection.create).toHaveBeenCalledWith(
				expect.objectContaining({
					is_public: false
				})
			);
		});

		it('should fail if name is not provided', async () => {
			const formData = new FormData();
			formData.append('name', '');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			const result = await actions.actions.create({
				request: mockRequest,
				locals: { user: testUser }
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Tag name is required' });
			expect(mockCollection.create).not.toHaveBeenCalled();
		});

		it('should handle database errors', async () => {
			const formData = new FormData();
			formData.append('name', 'Test Tag');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.create.mockRejectedValue(new Error('Database error'));

			const result = await actions.actions.create({
				request: mockRequest,
				locals: { user: testUser }
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Failed to create tag' });
		});
	});

	describe('update action', () => {
		it('should update tag successfully', async () => {
			const formData = new FormData();
			formData.append('id', 'tag123');
			formData.append('name', 'Updated Tag');
			formData.append('color', '#EF4444');
			formData.append('icon', '⭐');
			formData.append('is_public', 'on');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.update.mockResolvedValue({ id: 'tag123' });

			const result = await actions.actions.update({
				request: mockRequest
			} as any);

			expect(mockCollection.update).toHaveBeenCalledWith('tag123', {
				name: 'Updated Tag',
				slug: 'updated-tag',
				color: '#EF4444',
				icon: '⭐',
				is_public: true
			});

			expect(result).toEqual({ updated: true });
		});

		it('should fail if id is not provided', async () => {
			const formData = new FormData();
			formData.append('name', 'Tag');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			const result = await actions.actions.update({
				request: mockRequest
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Tag ID and name are required' });
			expect(mockCollection.update).not.toHaveBeenCalled();
		});

		it('should fail if name is not provided', async () => {
			const formData = new FormData();
			formData.append('id', 'tag123');
			formData.append('name', '');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			const result = await actions.actions.update({
				request: mockRequest
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Tag ID and name are required' });
		});

		it('should handle database errors', async () => {
			const formData = new FormData();
			formData.append('id', 'tag123');
			formData.append('name', 'Tag');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.update.mockRejectedValue(new Error('Database error'));

			const result = await actions.actions.update({
				request: mockRequest
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Failed to update tag' });
		});
	});

	describe('delete action', () => {
		it('should delete tag and its relationships', async () => {
			const formData = new FormData();
			formData.append('id', 'tag123');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			// Mock linktags relationships
			mockCollection.getList.mockResolvedValue({
				items: [{ id: 'link_tag_1' }, { id: 'link_tag_2' }]
			});

			mockCollection.delete.mockResolvedValue(true);

			const result = await actions.actions.delete({
				request: mockRequest
			} as any);

			// Should delete linktags first
			expected(pb.collection).toHaveBeenCalledWith('linktags');
			expect(mockCollection.getList).toHaveBeenCalledWith(1, 100, {
				filter: `tag_id="tag123"`
			});
			expect(mockCollection.delete).toHaveBeenCalledWith('link_tag_1');
			expect(mockCollection.delete).toHaveBeenCalledWith('link_tag_2');

			// Then delete the tag
			expect(pb.collection).toHaveBeenCalledWith('tags');
			expect(mockCollection.delete).toHaveBeenCalledWith('tag123');

			expect(result).toEqual({ deleted: true });
		});

		it('should handle tags with no relationships', async () => {
			const formData = new FormData();
			formData.append('id', 'tag123');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.getList.mockResolvedValue({
				items: []
			});

			mockCollection.delete.mockResolvedValue(true);

			const result = await actions.actions.delete({
				request: mockRequest
			} as any);

			expect(mockCollection.delete).toHaveBeenCalledTimes(1);
			expect(mockCollection.delete).toHaveBeenCalledWith('tag123');
			expect(result).toEqual({ deleted: true });
		});

		it('should fail if id is not provided', async () => {
			const formData = new FormData();

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			const result = await actions.actions.delete({
				request: mockRequest
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Tag ID is required' });
			expect(mockCollection.delete).not.toHaveBeenCalled();
		});

		it('should handle database errors', async () => {
			const formData = new FormData();
			formData.append('id', 'tag123');

			const mockRequest = {
				formData: vi.fn().mockResolvedValue(formData)
			};

			mockCollection.getList.mockRejectedValue(new Error('Database error'));

			const result = await actions.actions.delete({
				request: mockRequest
			} as any);

			expect(fail).toHaveBeenCalledWith(400, { error: 'Failed to delete tag' });
		});
	});
});
