import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock shared-api-client
const mockGet = vi.fn();
const mockPost = vi.fn();
const mockPatch = vi.fn();
const mockDelete = vi.fn();
const mockPut = vi.fn();
const mockUpload = vi.fn();

vi.mock('@manacore/shared-api-client', () => ({
	createApiClient: () => ({
		get: mockGet,
		post: mockPost,
		patch: mockPatch,
		delete: mockDelete,
		put: mockPut,
		upload: mockUpload,
	}),
}));

const mockGetAccessToken = vi.fn().mockResolvedValue('test-token');

vi.mock('$lib/stores/auth.svelte', () => ({
	authStore: {
		getAccessToken: mockGetAccessToken,
	},
}));

// Mock global fetch for download tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Import after mocks are set up
const { filesApi, foldersApi, sharesApi, tagsApi, trashApi, searchApi } = await import('./client');

beforeEach(() => {
	vi.clearAllMocks();
	mockGetAccessToken.mockResolvedValue('test-token');
});

// ---------------------------------------------------------------------------
// Helpers: reusable factory data
// ---------------------------------------------------------------------------

function makeFile(overrides: Record<string, unknown> = {}) {
	return {
		id: 'file-1',
		userId: 'user-1',
		name: 'document.pdf',
		originalName: 'document.pdf',
		mimeType: 'application/pdf',
		size: 102400,
		storagePath: '/user-1/document.pdf',
		storageKey: 'user-1/document.pdf',
		parentFolderId: null,
		currentVersion: 1,
		isFavorite: false,
		isDeleted: false,
		deletedAt: null,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

function makeFolder(overrides: Record<string, unknown> = {}) {
	return {
		id: 'folder-1',
		userId: 'user-1',
		name: 'Documents',
		description: null,
		color: null,
		parentFolderId: null,
		path: '/Documents',
		depth: 0,
		isFavorite: false,
		isDeleted: false,
		deletedAt: null,
		createdAt: '2026-01-01T00:00:00Z',
		updatedAt: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

function makeShare(overrides: Record<string, unknown> = {}) {
	return {
		id: 'share-1',
		userId: 'user-1',
		fileId: 'file-1',
		folderId: null,
		shareType: 'file',
		shareToken: 'abc123token',
		accessLevel: 'view',
		password: null,
		maxDownloads: null,
		downloadCount: 0,
		expiresAt: null,
		isActive: true,
		createdAt: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

function makeTag(overrides: Record<string, unknown> = {}) {
	return {
		id: 'tag-1',
		userId: 'user-1',
		name: 'Important',
		color: '#ff0000',
		createdAt: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// 1. File upload flow
// ---------------------------------------------------------------------------

describe('File upload flow', () => {
	it('creates FormData with file only when no folderId is provided', async () => {
		const uploadedFile = makeFile({ name: 'photo.jpg', mimeType: 'image/jpeg' });
		mockUpload.mockResolvedValue({ data: uploadedFile });

		const file = new File(['binary-content'], 'photo.jpg', { type: 'image/jpeg' });
		const result = await filesApi.upload(file);

		expect(mockUpload).toHaveBeenCalledTimes(1);
		const [endpoint, formData] = mockUpload.mock.calls[0];
		expect(endpoint).toBe('/files/upload');
		expect(formData).toBeInstanceOf(FormData);
		expect(formData.get('file')).toBe(file);
		expect(formData.get('parentFolderId')).toBeNull();
		expect(result.data).toEqual(uploadedFile);
		expect(result.error).toBeUndefined();
	});

	it('creates FormData with file and folderId when folderId is provided', async () => {
		const uploadedFile = makeFile({ parentFolderId: 'folder-1' });
		mockUpload.mockResolvedValue({ data: uploadedFile });

		const file = new File(['data'], 'report.pdf', { type: 'application/pdf' });
		const result = await filesApi.upload(file, 'folder-1');

		const [, formData] = mockUpload.mock.calls[0];
		expect(formData.get('file')).toBe(file);
		expect(formData.get('parentFolderId')).toBe('folder-1');
		expect(result.data).toEqual(uploadedFile);
	});

	it('returns error when upload fails', async () => {
		mockUpload.mockResolvedValue({ error: { message: 'File too large' } });

		const file = new File(['x'.repeat(200)], 'huge.bin');
		const result = await filesApi.upload(file);

		expect(result.error).toBe('File too large');
		expect(result.data).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// 2. File download
// ---------------------------------------------------------------------------

describe('File download', () => {
	it('fetches blob with correct auth header', async () => {
		const blobData = new Blob(['file-content'], { type: 'text/plain' });
		mockFetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(blobData),
		});

		const result = await filesApi.download('file-1');

		expect(mockFetch).toHaveBeenCalledWith('http://localhost:3016/api/v1/files/file-1/download', {
			headers: { Authorization: 'Bearer test-token' },
		});
		expect(result).toBeInstanceOf(Blob);
		expect(result).toBe(blobData);
	});

	it('returns null when response is not ok', async () => {
		mockFetch.mockResolvedValue({
			ok: false,
			status: 404,
		});

		const result = await filesApi.download('missing-file');

		expect(result).toBeNull();
	});

	it('returns null on network error', async () => {
		mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

		const result = await filesApi.download('file-1');

		expect(result).toBeNull();
	});

	it('uses the token from authStore', async () => {
		mockGetAccessToken.mockResolvedValue('different-token');
		mockFetch.mockResolvedValue({
			ok: true,
			blob: () => Promise.resolve(new Blob()),
		});

		await filesApi.download('file-1');

		expect(mockGetAccessToken).toHaveBeenCalled();
		expect(mockFetch).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				headers: { Authorization: 'Bearer different-token' },
			})
		);
	});
});

// ---------------------------------------------------------------------------
// 3. Folder with contents
// ---------------------------------------------------------------------------

describe('Folder with contents', () => {
	it('returns folder, files, and subfolders', async () => {
		const folder = makeFolder({ id: 'folder-1', name: 'Projects' });
		const files = [
			makeFile({ id: 'f1', name: 'readme.md', parentFolderId: 'folder-1' }),
			makeFile({ id: 'f2', name: 'notes.txt', parentFolderId: 'folder-1' }),
		];
		const subfolders = [
			makeFolder({ id: 'sf1', name: 'src', parentFolderId: 'folder-1', depth: 1 }),
		];

		mockGet.mockResolvedValue({
			data: { folder, files, subfolders },
		});

		const result = await foldersApi.get('folder-1');

		expect(mockGet).toHaveBeenCalledWith('/folders/folder-1');
		expect(result.data?.folder).toEqual(folder);
		expect(result.data?.files).toHaveLength(2);
		expect(result.data?.subfolders).toHaveLength(1);
		expect(result.data?.files[0].name).toBe('readme.md');
		expect(result.data?.subfolders[0].name).toBe('src');
	});

	it('returns error when folder does not exist', async () => {
		mockGet.mockResolvedValue({ error: { message: 'Folder not found' } });

		const result = await foldersApi.get('nonexistent');

		expect(result.error).toBe('Folder not found');
		expect(result.data).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// 4. Search with encoding
// ---------------------------------------------------------------------------

describe('Search with encoding', () => {
	it('encodes spaces in the query', async () => {
		mockGet.mockResolvedValue({ data: { files: [], folders: [] } });

		await searchApi.search('my documents');

		expect(mockGet).toHaveBeenCalledWith('/search?q=my%20documents');
	});

	it('encodes German umlauts (ä, ö, ü, ß)', async () => {
		mockGet.mockResolvedValue({ data: { files: [], folders: [] } });

		await searchApi.search('Übersicht für Bücher');

		expect(mockGet).toHaveBeenCalledWith(`/search?q=${encodeURIComponent('Übersicht für Bücher')}`);
	});

	it('encodes ampersands and special URL characters', async () => {
		mockGet.mockResolvedValue({ data: { files: [], folders: [] } });

		await searchApi.search('Q&A / notes #1');

		expect(mockGet).toHaveBeenCalledWith(`/search?q=${encodeURIComponent('Q&A / notes #1')}`);
	});

	it('returns matching files and folders from search results', async () => {
		const searchResults = {
			files: [makeFile({ id: 'f1', name: 'Ärzte-Bericht.pdf' })],
			folders: [makeFolder({ id: 'fo1', name: 'Ärzte' })],
		};
		mockGet.mockResolvedValue({ data: searchResults });

		const result = await searchApi.search('Ärzte');

		expect(result.data?.files).toHaveLength(1);
		expect(result.data?.folders).toHaveLength(1);
		expect(result.data?.files[0].name).toBe('Ärzte-Bericht.pdf');
	});
});

// ---------------------------------------------------------------------------
// 5. Share creation with all options
// ---------------------------------------------------------------------------

describe('Share creation with all options', () => {
	it('creates share with password, maxDownloads, and expiresAt', async () => {
		const shareData = {
			fileId: 'file-1',
			accessLevel: 'download' as const,
			password: 'securePass123!',
			maxDownloads: 5,
			expiresAt: '2026-06-01T00:00:00Z',
		};
		const createdShare = makeShare({
			...shareData,
			shareToken: 'generated-token',
			accessLevel: 'download',
		});
		mockPost.mockResolvedValue({ data: createdShare });

		const result = await sharesApi.create(shareData);

		expect(mockPost).toHaveBeenCalledWith('/shares', shareData);
		expect(result.data?.shareToken).toBe('generated-token');
		expect(result.data?.password).toBe('securePass123!');
		expect(result.data?.maxDownloads).toBe(5);
		expect(result.data?.expiresAt).toBe('2026-06-01T00:00:00Z');
	});

	it('creates share with minimal options (fileId only)', async () => {
		const shareData = { fileId: 'file-1' };
		mockPost.mockResolvedValue({
			data: makeShare({ accessLevel: 'view', password: null, maxDownloads: null }),
		});

		const result = await sharesApi.create(shareData);

		expect(mockPost).toHaveBeenCalledWith('/shares', { fileId: 'file-1' });
		expect(result.data?.accessLevel).toBe('view');
		expect(result.data?.password).toBeNull();
		expect(result.data?.maxDownloads).toBeNull();
	});

	it('creates share for a folder', async () => {
		const shareData = { folderId: 'folder-1', accessLevel: 'edit' as const };
		mockPost.mockResolvedValue({
			data: makeShare({
				fileId: null,
				folderId: 'folder-1',
				shareType: 'folder',
				accessLevel: 'edit',
			}),
		});

		const result = await sharesApi.create(shareData);

		expect(mockPost).toHaveBeenCalledWith('/shares', shareData);
		expect(result.data?.shareType).toBe('folder');
		expect(result.data?.folderId).toBe('folder-1');
		expect(result.data?.fileId).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// 6. Trash restore flow
// ---------------------------------------------------------------------------

describe('Trash restore flow', () => {
	it('restores a file using type=file query param', async () => {
		const restoredFile = makeFile({ isDeleted: false, deletedAt: null });
		mockPost.mockResolvedValue({ data: restoredFile });

		const result = await trashApi.restore('file-1', 'file');

		expect(mockPost).toHaveBeenCalledWith('/trash/file-1/restore?type=file', undefined);
		expect(result.data).toEqual(restoredFile);
	});

	it('restores a folder using type=folder query param', async () => {
		const restoredFolder = makeFolder({ isDeleted: false, deletedAt: null });
		mockPost.mockResolvedValue({ data: restoredFolder });

		const result = await trashApi.restore('folder-1', 'folder');

		expect(mockPost).toHaveBeenCalledWith('/trash/folder-1/restore?type=folder', undefined);
		expect(result.data).toEqual(restoredFolder);
	});

	it('permanently deletes a file with type=file', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		const result = await trashApi.permanentDelete('file-1', 'file');

		expect(mockDelete).toHaveBeenCalledWith('/trash/file-1?type=file');
		expect(result.data).toEqual({ success: true });
	});

	it('permanently deletes a folder with type=folder', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		const result = await trashApi.permanentDelete('folder-1', 'folder');

		expect(mockDelete).toHaveBeenCalledWith('/trash/folder-1?type=folder');
		expect(result.data).toEqual({ success: true });
	});

	it('empties the entire trash', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		const result = await trashApi.empty();

		expect(mockDelete).toHaveBeenCalledWith('/trash');
		expect(result.data).toEqual({ success: true });
	});
});

// ---------------------------------------------------------------------------
// 7. Bulk operations (multi-step sequence)
// ---------------------------------------------------------------------------

describe('Bulk operations', () => {
	it('create folder, upload file to it, then share it', async () => {
		// Step 1: Create a folder
		const newFolder = makeFolder({ id: 'new-folder', name: 'Shared Project' });
		mockPost.mockResolvedValueOnce({ data: newFolder });

		const folderResult = await foldersApi.create('Shared Project', undefined, 'blue');
		expect(folderResult.data).toEqual(newFolder);
		expect(mockPost).toHaveBeenCalledWith('/folders', {
			name: 'Shared Project',
			parentFolderId: undefined,
			color: 'blue',
		});

		// Step 2: Upload a file into that folder
		const uploadedFile = makeFile({
			id: 'uploaded-file',
			name: 'design.fig',
			parentFolderId: 'new-folder',
		});
		mockUpload.mockResolvedValueOnce({ data: uploadedFile });

		const file = new File(['figma-data'], 'design.fig');
		const uploadResult = await filesApi.upload(file, 'new-folder');
		expect(uploadResult.data).toEqual(uploadedFile);

		// Step 3: Share the file
		const share = makeShare({ fileId: 'uploaded-file', accessLevel: 'download' });
		mockPost.mockResolvedValueOnce({ data: share });

		const shareResult = await sharesApi.create({
			fileId: 'uploaded-file',
			accessLevel: 'download',
		});
		expect(shareResult.data?.shareToken).toBe('abc123token');
		expect(shareResult.data?.fileId).toBe('uploaded-file');
	});

	it('list files, rename one, then move it to another folder', async () => {
		// Step 1: List files
		const files = [
			makeFile({ id: 'f1', name: 'old-name.txt' }),
			makeFile({ id: 'f2', name: 'other.txt' }),
		];
		mockGet.mockResolvedValueOnce({ data: files });

		const listResult = await filesApi.list();
		expect(listResult.data).toHaveLength(2);

		// Step 2: Rename the first file
		const renamedFile = makeFile({ id: 'f1', name: 'new-name.txt' });
		mockPatch.mockResolvedValueOnce({ data: renamedFile });

		const renameResult = await filesApi.rename('f1', 'new-name.txt');
		expect(mockPatch).toHaveBeenCalledWith('/files/f1', { name: 'new-name.txt' });
		expect(renameResult.data?.name).toBe('new-name.txt');

		// Step 3: Move it to a folder
		const movedFile = makeFile({ id: 'f1', name: 'new-name.txt', parentFolderId: 'folder-1' });
		mockPatch.mockResolvedValueOnce({ data: movedFile });

		const moveResult = await filesApi.move('f1', 'folder-1');
		expect(mockPatch).toHaveBeenCalledWith('/files/f1/move', { parentFolderId: 'folder-1' });
		expect(moveResult.data).toEqual(movedFile);
	});

	it('create tag, create another tag, then list all tags', async () => {
		const tag1 = makeTag({ id: 'tag-1', name: 'Work', color: '#0000ff' });
		const tag2 = makeTag({ id: 'tag-2', name: 'Personal', color: '#00ff00' });

		mockPost.mockResolvedValueOnce({ data: tag1 });
		mockPost.mockResolvedValueOnce({ data: tag2 });
		mockGet.mockResolvedValueOnce({ data: [tag1, tag2] });

		const r1 = await tagsApi.create('Work', '#0000ff');
		const r2 = await tagsApi.create('Personal', '#00ff00');
		const r3 = await tagsApi.list();

		expect(r1.data?.name).toBe('Work');
		expect(r2.data?.name).toBe('Personal');
		expect(r3.data).toHaveLength(2);
	});
});

// ---------------------------------------------------------------------------
// 8. Error propagation
// ---------------------------------------------------------------------------

describe('Error propagation', () => {
	it('wraps API error in { error: message } format for GET', async () => {
		mockGet.mockResolvedValue({ error: { message: 'Unauthorized' } });

		const result = await filesApi.list();

		expect(result).toEqual({ error: 'Unauthorized' });
		expect(result.data).toBeUndefined();
	});

	it('wraps API error in { error: message } format for POST', async () => {
		mockPost.mockResolvedValue({ error: { message: 'Validation failed' } });

		const result = await foldersApi.create('');

		expect(result).toEqual({ error: 'Validation failed' });
	});

	it('wraps API error in { error: message } format for PATCH', async () => {
		mockPatch.mockResolvedValue({ error: { message: 'Not found' } });

		const result = await filesApi.rename('missing', 'new-name');

		expect(result).toEqual({ error: 'Not found' });
	});

	it('wraps API error in { error: message } format for DELETE', async () => {
		mockDelete.mockResolvedValue({ error: { message: 'Forbidden' } });

		const result = await filesApi.delete('not-yours');

		expect(result).toEqual({ error: 'Forbidden' });
	});

	it('wraps API error for upload', async () => {
		mockUpload.mockResolvedValue({ error: { message: 'Storage quota exceeded' } });

		const file = new File(['data'], 'file.txt');
		const result = await filesApi.upload(file);

		expect(result).toEqual({ error: 'Storage quota exceeded' });
	});

	it('returns data with no error property on success', async () => {
		const file = makeFile();
		mockGet.mockResolvedValue({ data: file });

		const result = await filesApi.get('file-1');

		expect(result.data).toEqual(file);
		expect(result.error).toBeUndefined();
	});

	it('returns null data as undefined in legacy format', async () => {
		mockGet.mockResolvedValue({ data: null });

		const result = await filesApi.get('file-1');

		expect(result.data).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// 9. Tag operations
// ---------------------------------------------------------------------------

describe('Tag operations', () => {
	it('creates a tag with name and color', async () => {
		const tag = makeTag({ name: 'Urgent', color: '#ff0000' });
		mockPost.mockResolvedValue({ data: tag });

		const result = await tagsApi.create('Urgent', '#ff0000');

		expect(mockPost).toHaveBeenCalledWith('/tags', { name: 'Urgent', color: '#ff0000' });
		expect(result.data).toEqual(tag);
	});

	it('creates a tag without color', async () => {
		const tag = makeTag({ name: 'Archive', color: null });
		mockPost.mockResolvedValue({ data: tag });

		const result = await tagsApi.create('Archive');

		expect(mockPost).toHaveBeenCalledWith('/tags', { name: 'Archive', color: undefined });
		expect(result.data?.color).toBeNull();
	});

	it('updates a tag name and color', async () => {
		const updatedTag = makeTag({ name: 'Renamed', color: '#00ff00' });
		mockPatch.mockResolvedValue({ data: updatedTag });

		const result = await tagsApi.update('tag-1', { name: 'Renamed', color: '#00ff00' });

		expect(mockPatch).toHaveBeenCalledWith('/tags/tag-1', {
			name: 'Renamed',
			color: '#00ff00',
		});
		expect(result.data?.name).toBe('Renamed');
	});

	it('lists all tags', async () => {
		const tags = [
			makeTag({ id: 'tag-1', name: 'Work' }),
			makeTag({ id: 'tag-2', name: 'Personal' }),
			makeTag({ id: 'tag-3', name: 'Archive' }),
		];
		mockGet.mockResolvedValue({ data: tags });

		const result = await tagsApi.list();

		expect(mockGet).toHaveBeenCalledWith('/tags');
		expect(result.data).toHaveLength(3);
	});

	it('deletes a tag', async () => {
		mockDelete.mockResolvedValue({ data: { success: true } });

		const result = await tagsApi.delete('tag-1');

		expect(mockDelete).toHaveBeenCalledWith('/tags/tag-1');
		expect(result.data).toEqual({ success: true });
	});
});

// ---------------------------------------------------------------------------
// 10. Favorites endpoint
// ---------------------------------------------------------------------------

describe('Favorites endpoint', () => {
	it('returns structured response with favorite files and folders', async () => {
		const favFiles = [
			makeFile({ id: 'f1', name: 'starred.pdf', isFavorite: true }),
			makeFile({ id: 'f2', name: 'bookmarked.doc', isFavorite: true }),
		];
		const favFolders = [makeFolder({ id: 'fo1', name: 'Pinned', isFavorite: true })];

		mockGet.mockResolvedValue({ data: { files: favFiles, folders: favFolders } });

		const result = await searchApi.favorites();

		expect(mockGet).toHaveBeenCalledWith('/favorites');
		expect(result.data?.files).toHaveLength(2);
		expect(result.data?.folders).toHaveLength(1);
		expect(result.data?.files.every((f: { isFavorite: boolean }) => f.isFavorite)).toBe(true);
		expect(result.data?.folders[0].isFavorite).toBe(true);
	});

	it('returns empty arrays when no favorites exist', async () => {
		mockGet.mockResolvedValue({ data: { files: [], folders: [] } });

		const result = await searchApi.favorites();

		expect(result.data?.files).toEqual([]);
		expect(result.data?.folders).toEqual([]);
	});

	it('returns error when user is not authenticated', async () => {
		mockGet.mockResolvedValue({ error: { message: 'Unauthorized' } });

		const result = await searchApi.favorites();

		expect(result.error).toBe('Unauthorized');
		expect(result.data).toBeUndefined();
	});
});
