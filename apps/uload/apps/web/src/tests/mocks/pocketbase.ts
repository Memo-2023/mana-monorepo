import { vi } from 'vitest';
import type { Mock } from 'vitest';

export interface MockCollection {
	create: Mock;
	update: Mock;
	delete: Mock;
	getList: Mock;
	getOne: Mock;
	getFirstListItem: Mock;
	authWithPassword: Mock;
}

export interface MockPocketBase {
	collection: Mock<[string], MockCollection>;
	authStore: {
		isValid: boolean;
		token: string;
		model: any;
		clear: Mock;
	};
	baseUrl: string;
}

export function createMockPocketBase(): MockPocketBase {
	return {
		collection: vi.fn((name: string) => ({
			create: vi.fn(),
			update: vi.fn(),
			delete: vi.fn(),
			getList: vi.fn(() =>
				Promise.resolve({
					items: [],
					totalItems: 0,
					totalPages: 0,
					page: 1,
					perPage: 20,
				})
			),
			getOne: vi.fn(),
			getFirstListItem: vi.fn(() => Promise.reject(new Error('No items found'))),
			authWithPassword: vi.fn(),
		})),
		authStore: {
			isValid: false,
			token: '',
			model: null,
			clear: vi.fn(),
		},
		baseUrl: 'http://localhost:8090',
	};
}

export function mockSuccessfulAuth(pb: MockPocketBase, user: any) {
	const collection = pb.collection('users') as MockCollection;
	collection.authWithPassword.mockResolvedValue({
		token: 'mock-token',
		record: user,
	});
	pb.authStore.isValid = true;
	pb.authStore.token = 'mock-token';
	pb.authStore.model = user;
}

export function mockFailedAuth(pb: MockPocketBase, error: string = 'Invalid credentials') {
	const collection = pb.collection('users') as MockCollection;
	collection.authWithPassword.mockRejectedValue(new Error(error));
}

export function mockCreateSuccess(pb: MockPocketBase, collectionName: string, data: any) {
	const collection = pb.collection(collectionName) as MockCollection;
	collection.create.mockResolvedValue({
		...data,
		id: 'mock-id-' + Date.now(),
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
	});
}

export function mockCreateError(pb: MockPocketBase, collectionName: string, error: any) {
	const collection = pb.collection(collectionName) as MockCollection;
	collection.create.mockRejectedValue(error);
}

export function mockGetListSuccess(pb: MockPocketBase, collectionName: string, items: any[]) {
	const collection = pb.collection(collectionName) as MockCollection;
	collection.getList.mockResolvedValue({
		items,
		totalItems: items.length,
		totalPages: 1,
		page: 1,
		perPage: 20,
	});
}

export function mockUpdateSuccess(pb: MockPocketBase, collectionName: string, updatedData: any) {
	const collection = pb.collection(collectionName) as MockCollection;
	collection.update.mockResolvedValue({
		...updatedData,
		updated: new Date().toISOString(),
	});
}

export function mockDeleteSuccess(pb: MockPocketBase, collectionName: string) {
	const collection = pb.collection(collectionName) as MockCollection;
	collection.delete.mockResolvedValue(true);
}
