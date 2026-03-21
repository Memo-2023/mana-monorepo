import { randomUUID } from 'crypto';

// File mock factory
export const mockFileFactory = {
	create: (overrides: Record<string, any> = {}) => ({
		id: randomUUID(),
		userId: 'test-user-id',
		name: 'test-file.pdf',
		originalName: 'test-file.pdf',
		mimeType: 'application/pdf',
		size: 1024,
		storagePath: 'users/test-user-id/test-file.pdf',
		storageKey: `users/test-user-id/${randomUUID()}-test-file.pdf`,
		parentFolderId: null,
		currentVersion: 1,
		isFavorite: false,
		isDeleted: false,
		deletedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),
	createMany: (count: number, overrides: Record<string, any> = {}) =>
		Array.from({ length: count }, () => mockFileFactory.create(overrides)),
};

// Folder mock factory
export const mockFolderFactory = {
	create: (overrides: Record<string, any> = {}) => ({
		id: randomUUID(),
		userId: 'test-user-id',
		name: 'Test Folder',
		description: null,
		color: null,
		parentFolderId: null,
		path: '/Test Folder',
		depth: 0,
		isFavorite: false,
		isDeleted: false,
		deletedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	}),
	createMany: (count: number, overrides: Record<string, any> = {}) =>
		Array.from({ length: count }, () => mockFolderFactory.create(overrides)),
};

// Share mock factory
export const mockShareFactory = {
	create: (overrides: Record<string, any> = {}) => ({
		id: randomUUID(),
		userId: 'test-user-id',
		fileId: null,
		folderId: null,
		shareType: 'file',
		shareToken: randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, ''),
		accessLevel: 'view',
		password: null,
		maxDownloads: null,
		downloadCount: 0,
		expiresAt: null,
		isActive: true,
		createdAt: new Date(),
		lastAccessedAt: null,
		...overrides,
	}),
};

// Tag mock factory
export const mockTagFactory = {
	create: (overrides: Record<string, any> = {}) => ({
		id: randomUUID(),
		userId: 'test-user-id',
		name: 'Test Tag',
		color: '#3b82f6',
		createdAt: new Date(),
		...overrides,
	}),
};

// Database mock helper - chainable query builder
export function createMockDb() {
	const chain: any = {};
	const methods = [
		'select',
		'from',
		'where',
		'insert',
		'values',
		'returning',
		'update',
		'set',
		'delete',
		'innerJoin',
		'limit',
		'orderBy',
		'onConflictDoNothing',
	];

	for (const method of methods) {
		chain[method] = jest.fn().mockReturnValue(chain);
	}

	// Make the chain thenable so await works on any terminal method
	chain.then = undefined;

	return chain;
}
