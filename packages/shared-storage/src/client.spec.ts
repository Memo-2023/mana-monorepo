import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StorageConfig, BucketConfig } from './types';

const { mockSend, mockUploadDone, mockGetSignedUrl } = vi.hoisted(() => ({
	mockSend: vi.fn(),
	mockUploadDone: vi.fn().mockResolvedValue({ ETag: '"multipart-etag"' }),
	mockGetSignedUrl: vi.fn().mockResolvedValue('https://signed.url/file'),
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock AWS SDK — all classes must use function() for `new` support
vi.mock('@aws-sdk/client-s3', () => ({
	S3Client: vi.fn(function (this: any) {
		this.send = mockSend;
	}),
	PutObjectCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	GetObjectCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	DeleteObjectCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	DeleteObjectsCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	ListObjectsV2Command: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	HeadObjectCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
}));

vi.mock('@aws-sdk/lib-storage', () => ({
	Upload: vi.fn(function (this: Record<string, unknown>) {
		this.done = mockUploadDone;
	}),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
	getSignedUrl: mockGetSignedUrl,
}));

// Import after mocks
import { StorageClient } from './client';

const TEST_CONFIG: StorageConfig = {
	endpoint: 'http://localhost:9000',
	region: 'us-east-1',
	accessKeyId: 'test-key',
	secretAccessKey: 'test-secret',
	forcePathStyle: true,
};

const TEST_BUCKET: BucketConfig = {
	name: 'test-bucket',
	publicUrl: 'http://localhost:9000/test-bucket',
};

describe('StorageClient', () => {
	let storage: StorageClient;

	beforeEach(() => {
		mockSend.mockReset();
		mockUploadDone.mockReset().mockResolvedValue({ ETag: '"multipart-etag"' });
		mockGetSignedUrl.mockReset().mockResolvedValue('https://signed.url/file');
		storage = new StorageClient(TEST_CONFIG, TEST_BUCKET);
	});

	describe('upload', () => {
		it('uploads a file and returns key and url', async () => {
			mockSend.mockResolvedValue({ ETag: '"abc123"' });

			const result = await storage.upload('test.png', Buffer.from('data'), {
				contentType: 'image/png',
			});

			expect(result.key).toBe('test.png');
			expect(result.url).toBe('http://localhost:9000/test-bucket/test.png');
			expect(result.etag).toBe('"abc123"');
		});

		it('throws when file exceeds maxSizeBytes', async () => {
			const bigBuffer = Buffer.alloc(1024);
			await expect(storage.upload('file.png', bigBuffer, { maxSizeBytes: 512 })).rejects.toThrow(
				'File size 1024 bytes exceeds maximum allowed 512 bytes'
			);
		});

		it('allows file within maxSizeBytes', async () => {
			mockSend.mockResolvedValue({ ETag: '"ok"' });
			const result = await storage.upload('file.png', Buffer.alloc(100), { maxSizeBytes: 512 });
			expect(result.key).toBe('file.png');
		});

		it('sets ACL to public-read when public option is true', async () => {
			mockSend.mockResolvedValue({ ETag: '"abc"' });
			const { PutObjectCommand } = await import('@aws-sdk/client-s3');

			await storage.upload('file.png', Buffer.from('data'), { public: true });

			expect(PutObjectCommand).toHaveBeenCalledWith(
				expect.objectContaining({ ACL: 'public-read' })
			);
		});
	});

	describe('uploadMultipart', () => {
		it('throws when file exceeds maxSizeBytes', async () => {
			const bigBuffer = Buffer.alloc(2048);
			await expect(
				storage.uploadMultipart('big.zip', bigBuffer, { maxSizeBytes: 1024 })
			).rejects.toThrow('File size 2048 bytes exceeds maximum allowed 1024 bytes');
		});

		it('uses Upload from lib-storage', async () => {
			const { Upload } = await import('@aws-sdk/lib-storage');

			const result = await storage.uploadMultipart('big-file.zip', Buffer.from('data'));

			expect(Upload).toHaveBeenCalledWith(
				expect.objectContaining({
					queueSize: 4,
					partSize: 10 * 1024 * 1024,
				})
			);
			expect(result.key).toBe('big-file.zip');
			expect(result.etag).toBe('"multipart-etag"');
		});
	});

	describe('download', () => {
		it('downloads and returns a buffer', async () => {
			const chunks = [new Uint8Array([1, 2]), new Uint8Array([3, 4])];
			mockSend.mockResolvedValue({
				Body: (async function* () {
					for (const chunk of chunks) yield chunk;
				})(),
			});

			const result = await storage.download('file.bin');

			expect(result).toEqual(Buffer.from([1, 2, 3, 4]));
		});

		it('throws when Body is missing', async () => {
			mockSend.mockResolvedValue({ Body: null });

			await expect(storage.download('missing.bin')).rejects.toThrow('File not found: missing.bin');
		});
	});

	describe('downloadStream', () => {
		it('returns a ReadableStream', async () => {
			const mockStream = new ReadableStream();
			mockSend.mockResolvedValue({
				Body: { transformToWebStream: () => mockStream },
			});

			const result = await storage.downloadStream('file.bin');

			expect(result).toBe(mockStream);
		});

		it('throws when Body is missing', async () => {
			mockSend.mockResolvedValue({ Body: null });

			await expect(storage.downloadStream('missing.bin')).rejects.toThrow(
				'File not found: missing.bin'
			);
		});
	});

	describe('delete', () => {
		it('sends DeleteObjectCommand', async () => {
			mockSend.mockResolvedValue({});
			const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');

			await storage.delete('file.png');

			expect(DeleteObjectCommand).toHaveBeenCalledWith(
				expect.objectContaining({ Bucket: 'test-bucket', Key: 'file.png' })
			);
		});
	});

	describe('deleteMany', () => {
		it('deletes multiple files in one request', async () => {
			mockSend.mockResolvedValue({});
			const { DeleteObjectsCommand } = await import('@aws-sdk/client-s3');

			await storage.deleteMany(['a.png', 'b.png', 'c.png']);

			expect(DeleteObjectsCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					Bucket: 'test-bucket',
					Delete: {
						Objects: [{ Key: 'a.png' }, { Key: 'b.png' }, { Key: 'c.png' }],
						Quiet: true,
					},
				})
			);
		});

		it('does nothing for empty array', async () => {
			await storage.deleteMany([]);
			expect(mockSend).not.toHaveBeenCalled();
		});

		it('batches requests for >1000 keys', async () => {
			mockSend.mockResolvedValue({});
			const keys = Array.from({ length: 1500 }, (_, i) => `file-${i}.png`);

			await storage.deleteMany(keys);

			expect(mockSend).toHaveBeenCalledTimes(2);
		});
	});

	describe('exists', () => {
		it('returns true when file exists', async () => {
			mockSend.mockResolvedValue({});

			expect(await storage.exists('file.png')).toBe(true);
		});

		it('returns false on NotFound error', async () => {
			const error = new Error('Not Found');
			error.name = 'NotFound';
			mockSend.mockRejectedValue(error);

			expect(await storage.exists('missing.png')).toBe(false);
		});

		it('returns false on 404 status code', async () => {
			const error: Error & { $metadata?: { httpStatusCode: number } } = new Error('Not Found');
			error.$metadata = { httpStatusCode: 404 };
			mockSend.mockRejectedValue(error);

			expect(await storage.exists('missing.png')).toBe(false);
		});

		it('rethrows non-404 errors', async () => {
			const error = new Error('Network failure');
			error.name = 'NetworkError';
			mockSend.mockRejectedValue(error);

			await expect(storage.exists('file.png')).rejects.toThrow('Network failure');
		});
	});

	describe('list', () => {
		it('returns files from single page', async () => {
			mockSend.mockResolvedValue({
				Contents: [
					{ Key: 'a.png', Size: 100, LastModified: new Date('2024-01-01'), ETag: '"aaa"' },
					{ Key: 'b.png', Size: 200, LastModified: new Date('2024-01-02'), ETag: '"bbb"' },
				],
				IsTruncated: false,
			});

			const files = await storage.list('users/');

			expect(files).toHaveLength(2);
			expect(files[0].key).toBe('a.png');
			expect(files[1].size).toBe(200);
		});

		it('paginates through multiple pages', async () => {
			mockSend
				.mockResolvedValueOnce({
					Contents: [{ Key: 'a.png', Size: 100, LastModified: new Date() }],
					IsTruncated: true,
					NextContinuationToken: 'token-1',
				})
				.mockResolvedValueOnce({
					Contents: [{ Key: 'b.png', Size: 200, LastModified: new Date() }],
					IsTruncated: false,
				});

			const files = await storage.list();

			expect(files).toHaveLength(2);
			expect(mockSend).toHaveBeenCalledTimes(2);
		});

		it('returns empty array when no contents', async () => {
			mockSend.mockResolvedValue({ Contents: undefined, IsTruncated: false });

			const files = await storage.list();

			expect(files).toEqual([]);
		});
	});

	describe('getPublicUrl', () => {
		it('returns url with publicUrl configured', () => {
			expect(storage.getPublicUrl('users/avatar.png')).toBe(
				'http://localhost:9000/test-bucket/users/avatar.png'
			);
		});

		it('returns undefined without publicUrl', () => {
			const client = new StorageClient(TEST_CONFIG, { name: 'private-bucket' });
			expect(client.getPublicUrl('file.png')).toBeUndefined();
		});
	});

	describe('getCdnUrl', () => {
		it('returns CDN url when configured', () => {
			const client = new StorageClient(TEST_CONFIG, {
				name: 'test-bucket',
				cdnUrl: 'https://cdn.example.com',
			});

			expect(client.getCdnUrl('file.png')).toBe('https://cdn.example.com/file.png');
		});

		it('falls back to publicUrl when no CDN', () => {
			expect(storage.getCdnUrl('file.png')).toBe('http://localhost:9000/test-bucket/file.png');
		});

		it('returns undefined when neither CDN nor publicUrl set', () => {
			const client = new StorageClient(TEST_CONFIG, { name: 'bare-bucket' });
			expect(client.getCdnUrl('file.png')).toBeUndefined();
		});
	});

	describe('getBucketName', () => {
		it('returns the bucket name', () => {
			expect(storage.getBucketName()).toBe('test-bucket');
		});
	});

	describe('presigned URLs', () => {
		it('getUploadUrl returns a signed URL', async () => {
			const url = await storage.getUploadUrl('upload.png');
			expect(url).toBe('https://signed.url/file');
		});

		it('getDownloadUrl returns a signed URL', async () => {
			const url = await storage.getDownloadUrl('download.png');
			expect(url).toBe('https://signed.url/file');
		});
	});
});
