import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the client module — StorageClient must be a class
vi.mock('./client', () => ({
	StorageClient: vi.fn(function (this: Record<string, unknown>) {
		this.upload = vi.fn();
		this.getBucketName = vi.fn();
	}),
}));

import {
	createStorage,
	createStorageClient,
	createPictureStorage,
	createChatStorage,
} from './factory';
import { BUCKETS } from './types';
import { StorageClient } from './client';

describe('createStorage', () => {
	beforeEach(() => {
		process.env.NODE_ENV = 'development';
	});

	afterEach(() => {
		delete process.env.PICTURE_STORAGE_PUBLIC_URL;
		delete process.env.PICTURE_CDN_URL;
	});

	it('creates a client with the correct bucket name', () => {
		createStorage('PICTURE');

		expect(StorageClient).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ name: BUCKETS.PICTURE })
		);
	});

	it('resolves public URL from environment', () => {
		process.env.PICTURE_STORAGE_PUBLIC_URL = 'https://cdn.example.com/picture';

		createStorage('PICTURE');

		expect(StorageClient).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ publicUrl: 'https://cdn.example.com/picture' })
		);
	});

	it('resolves CDN URL from environment', () => {
		process.env.PICTURE_CDN_URL = 'https://cdn.fast.com/picture';

		createStorage('PICTURE');

		expect(StorageClient).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ cdnUrl: 'https://cdn.fast.com/picture' })
		);
	});

	it('allows explicit publicUrl override', () => {
		process.env.PICTURE_STORAGE_PUBLIC_URL = 'https://from-env.com';

		createStorage('PICTURE', 'https://explicit.com');

		expect(StorageClient).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ publicUrl: 'https://explicit.com' })
		);
	});
});

describe('convenience aliases', () => {
	it('createPictureStorage creates PICTURE bucket', () => {
		createPictureStorage();

		expect(StorageClient).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ name: BUCKETS.PICTURE })
		);
	});

	it('createChatStorage creates CHAT bucket', () => {
		createChatStorage();

		expect(StorageClient).toHaveBeenCalledWith(
			expect.any(Object),
			expect.objectContaining({ name: BUCKETS.CHAT })
		);
	});
});

describe('createStorageClient', () => {
	afterEach(() => {
		process.env.NODE_ENV = 'development';
		delete process.env.S3_ENDPOINT;
		delete process.env.S3_ACCESS_KEY;
		delete process.env.S3_SECRET_KEY;
	});

	it('throws when endpoint is missing in production', () => {
		process.env.NODE_ENV = 'production';
		process.env.S3_ENDPOINT = '';

		expect(() => createStorageClient(BUCKETS.CHAT)).toThrow('S3_ENDPOINT is required');
	});

	it('throws when credentials are missing in production', () => {
		process.env.NODE_ENV = 'production';
		process.env.S3_ENDPOINT = 'https://s3.example.com';
		process.env.S3_ACCESS_KEY = '';
		process.env.S3_SECRET_KEY = '';

		expect(() => createStorageClient(BUCKETS.CHAT)).toThrow(
			'S3_ACCESS_KEY and S3_SECRET_KEY are required'
		);
	});

	it('uses MinIO defaults in development', () => {
		process.env.NODE_ENV = 'development';

		createStorageClient(BUCKETS.CHAT);

		expect(StorageClient).toHaveBeenCalledWith(
			expect.objectContaining({
				endpoint: 'http://localhost:9000',
				accessKeyId: 'minioadmin',
			}),
			expect.any(Object)
		);
	});
});
