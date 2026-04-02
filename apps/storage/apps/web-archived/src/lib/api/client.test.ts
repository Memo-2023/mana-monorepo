import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock shared-api-client
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockUpload = vi.fn();

vi.mock('@manacore/shared-api-client', () => ({
	createApiClient: () => ({
		get: mockGet,
		post: mockPost,
		patch: mockPatch,
		delete: mockDelete,
		put: vi.fn(),
		upload: mockUpload,
	}),
}));

vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: vi.fn().mockResolvedValue('test-token'),
	},
}));

// Import after mocks are set up
const { filesApi, foldersApi, sharesApi, tagsApi, trashApi, searchApi } = await import('./client');

beforeEach(() => {
	vi.clearAllMocks();
});

describe('filesApi', () => {
	it('list() calls GET /files', async () => {
		const mockFiles = [{ id: '1', name: 'test.txt' }];
		mockGet.mockResolvedValue({ data: mockFiles });

		const result = await filesApi.list();

		expect(mockGet).toHaveBeenCalledWith('/files');
		expect(result.data).toEqual(mockFiles);
	});

	it('list(folderId) calls GET /files?folderId=folder-id', async () => {
		const mockFiles = [{ id: '2', name: 'nested.txt' }];
		mockGet.mockResolvedValue({ data: mockFiles });

		const result = await filesApi.list('folder-id');

		expect(mockGet).toHaveBeenCalledWith('/files?folderId=folder-id');
		expect(result.data).toEqual(mockFiles);
	});

	it('rename(id, name) calls PATCH /files/:id', async () => {
		const updatedFile = { id: 'file-1', name: 'renamed.txt' };
		mockPatch.mockResolvedValue({ data: updatedFile });

		const result = await filesApi.rename('file-1', 'renamed.txt');

		expect(mockPatch).toHaveBeenCalledWith('/files/file-1', { name: 'renamed.txt' });
		expect(result.data).toEqual(updatedFile);
	});

	it('delete(id) calls DELETE /files/:id', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		const result = await filesApi.delete('file-1');

		expect(mockDelete).toHaveBeenCalledWith('/files/file-1');
		expect(result.data).toEqual({ success: true });
	});

	it('toggleFavorite(id) calls POST /files/:id/favorite', async () => {
		const updatedFile = { id: 'file-1', isFavorite: true };
		mockPost.mockResolvedValue({ data: updatedFile });

		const result = await filesApi.toggleFavorite('file-1');

		expect(mockPost).toHaveBeenCalledWith('/files/file-1/favorite', undefined);
		expect(result.data).toEqual(updatedFile);
	});

	it('returns error on API failure', async () => {
		mockGet.mockResolvedValue({ error: { message: 'Not found' } });

		const result = await filesApi.list();

		expect(result.error).toBe('Not found');
		expect(result.data).toBeUndefined();
	});
});

describe('foldersApi', () => {
	it('create(name) calls POST /folders', async () => {
		const newFolder = { id: 'folder-1', name: 'New Folder' };
		mockPost.mockResolvedValue({ data: newFolder });

		const result = await foldersApi.create('New Folder');

		expect(mockPost).toHaveBeenCalledWith('/folders', {
			name: 'New Folder',
			parentFolderId: undefined,
			color: undefined,
		});
		expect(result.data).toEqual(newFolder);
	});

	it('create(name, parentId, color) passes all params', async () => {
		mockPost.mockResolvedValue({ data: { id: 'folder-2' } });

		await foldersApi.create('Sub Folder', 'parent-1', 'blue');

		expect(mockPost).toHaveBeenCalledWith('/folders', {
			name: 'Sub Folder',
			parentFolderId: 'parent-1',
			color: 'blue',
		});
	});

	it('list() calls GET /folders', async () => {
		mockGet.mockResolvedValue({ data: [] });

		await foldersApi.list();

		expect(mockGet).toHaveBeenCalledWith('/folders');
	});

	it('list(parentId) calls GET /folders?parentId=...', async () => {
		mockGet.mockResolvedValue({ data: [] });

		await foldersApi.list('parent-1');

		expect(mockGet).toHaveBeenCalledWith('/folders?parentId=parent-1');
	});

	it('delete(id) calls DELETE /folders/:id', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		const result = await foldersApi.delete('folder-1');

		expect(mockDelete).toHaveBeenCalledWith('/folders/folder-1');
		expect(result.data).toEqual({ success: true });
	});
});

describe('sharesApi', () => {
	it('list() calls GET /shares', async () => {
		const mockShares = [{ id: 'share-1', shareToken: 'abc' }];
		mockGet.mockResolvedValue({ data: mockShares });

		const result = await sharesApi.list();

		expect(mockGet).toHaveBeenCalledWith('/shares');
		expect(result.data).toEqual(mockShares);
	});

	it('create(data) calls POST /shares', async () => {
		const shareData = { fileId: 'file-1', accessLevel: 'view' as const };
		mockPost.mockResolvedValue({ data: { id: 'share-1', shareToken: 'xyz' } });

		const result = await sharesApi.create(shareData);

		expect(mockPost).toHaveBeenCalledWith('/shares', shareData);
		expect(result.data).toEqual({ id: 'share-1', shareToken: 'xyz' });
	});

	it('delete(id) calls DELETE /shares/:id', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		await sharesApi.delete('share-1');

		expect(mockDelete).toHaveBeenCalledWith('/shares/share-1');
	});
});

describe('tagsApi', () => {
	it('create(name, color) calls POST /tags', async () => {
		const newTag = { id: 'tag-1', name: 'Important', color: 'red' };
		mockPost.mockResolvedValue({ data: newTag });

		const result = await tagsApi.create('Important', 'red');

		expect(mockPost).toHaveBeenCalledWith('/tags', { name: 'Important', color: 'red' });
		expect(result.data).toEqual(newTag);
	});

	it('create(name) works without color', async () => {
		mockPost.mockResolvedValue({ data: { id: 'tag-2', name: 'Work' } });

		await tagsApi.create('Work');

		expect(mockPost).toHaveBeenCalledWith('/tags', { name: 'Work', color: undefined });
	});

	it('list() calls GET /tags', async () => {
		mockGet.mockResolvedValue({ data: [] });

		await tagsApi.list();

		expect(mockGet).toHaveBeenCalledWith('/tags');
	});

	it('delete(id) calls DELETE /tags/:id', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		await tagsApi.delete('tag-1');

		expect(mockDelete).toHaveBeenCalledWith('/tags/tag-1');
	});
});

describe('trashApi', () => {
	it('list() calls GET /trash', async () => {
		const trashItems = { files: [], folders: [] };
		mockGet.mockResolvedValue({ data: trashItems });

		const result = await trashApi.list();

		expect(mockGet).toHaveBeenCalledWith('/trash');
		expect(result.data).toEqual(trashItems);
	});

	it('restore(id, type) calls POST /trash/:id/restore', async () => {
		mockPost.mockResolvedValue({ data: { id: 'file-1' } });

		await trashApi.restore('file-1', 'file');

		expect(mockPost).toHaveBeenCalledWith('/trash/file-1/restore?type=file', undefined);
	});

	it('empty() calls DELETE /trash', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		await trashApi.empty();

		expect(mockDelete).toHaveBeenCalledWith('/trash');
	});
});

describe('searchApi', () => {
	it('search(query) calls GET /search?q=...', async () => {
		const searchResults = { files: [{ id: '1', name: 'match.txt' }], folders: [] };
		mockGet.mockResolvedValue({ data: searchResults });

		const result = await searchApi.search('match');

		expect(mockGet).toHaveBeenCalledWith('/search?q=match');
		expect(result.data).toEqual(searchResults);
	});

	it('search(query) encodes special characters', async () => {
		mockGet.mockResolvedValue({ data: { files: [], folders: [] } });

		await searchApi.search('hello world & more');

		expect(mockGet).toHaveBeenCalledWith('/search?q=hello%20world%20%26%20more');
	});

	it('favorites() calls GET /favorites', async () => {
		const favs = { files: [{ id: '1', isFavorite: true }], folders: [] };
		mockGet.mockResolvedValue({ data: favs });

		const result = await searchApi.favorites();

		expect(mockGet).toHaveBeenCalledWith('/favorites');
		expect(result.data).toEqual(favs);
	});
});

describe('error handling', () => {
	it('returns error message when API returns error', async () => {
		mockGet.mockResolvedValue({ error: { message: 'Unauthorized' } });

		const result = await filesApi.get('non-existent');

		expect(result.error).toBe('Unauthorized');
		expect(result.data).toBeUndefined();
	});

	it('returns data when API succeeds', async () => {
		const file = { id: 'file-1', name: 'test.txt' };
		mockGet.mockResolvedValue({ data: file });

		const result = await filesApi.get('file-1');

		expect(result.data).toEqual(file);
		expect(result.error).toBeUndefined();
	});
});
