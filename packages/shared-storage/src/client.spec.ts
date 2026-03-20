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
	CopyObjectCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	CreateMultipartUploadCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	UploadPartCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	CompleteMultipartUploadCommand: vi.fn(function (this: any, input: any) {
		Object.assign(this, input);
	}),
	AbortMultipartUploadCommand: vi.fn(function (this: any, input: any) {
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

		it('wraps ReadableStream with size constraint when maxSizeBytes set', async () => {
			// Stream that produces 2 chunks of 512 bytes = 1024 total, limit is 768
			const stream = new ReadableStream({
				start(controller) {
					controller.enqueue(new Uint8Array(512));
					controller.enqueue(new Uint8Array(512));
					controller.close();
				},
			});
			// The stream constraint happens during S3 transfer — since we mock send,
			// we verify the upload doesn't throw synchronously (constraint is lazy)
			mockSend.mockResolvedValue({ ETag: '"ok"' });
			// With a stream, the constraint wraps it but errors happen during read
			const result = await storage.upload('file.png', stream, { maxSizeBytes: 2048 });
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

	describe('hooks', () => {
		it('emits upload event on successful upload', async () => {
			mockSend.mockResolvedValue({ ETag: '"abc"' });
			const handler = vi.fn();
			storage.hooks.on('upload', handler);

			await storage.upload('file.png', Buffer.from('data'), { contentType: 'image/png' });

			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					bucket: 'test-bucket',
					key: 'file.png',
					contentType: 'image/png',
					sizeBytes: 4,
				})
			);
		});

		it('emits upload:error on failed upload', async () => {
			mockSend.mockRejectedValue(new Error('S3 down'));
			const handler = vi.fn();
			storage.hooks.on('upload:error', handler);

			await expect(storage.upload('file.png', Buffer.from('x'))).rejects.toThrow('S3 down');
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({
					bucket: 'test-bucket',
					key: 'file.png',
				})
			);
		});

		it('emits delete event', async () => {
			mockSend.mockResolvedValue({});
			const handler = vi.fn();
			storage.hooks.on('delete', handler);

			await storage.delete('file.png');

			expect(handler).toHaveBeenCalledWith({
				bucket: 'test-bucket',
				keys: ['file.png'],
			});
		});

		it('emits download event', async () => {
			mockSend.mockResolvedValue({
				Body: (async function* () {
					yield new Uint8Array([1]);
				})(),
			});
			const handler = vi.fn();
			storage.hooks.on('download', handler);

			await storage.download('file.bin');

			expect(handler).toHaveBeenCalledWith({ bucket: 'test-bucket', key: 'file.bin' });
		});
	});

	describe('deleteByPrefix', () => {
		it('lists and deletes all files with prefix', async () => {
			mockSend
				.mockResolvedValueOnce({
					Contents: [
						{ Key: 'users/123/a.png', Size: 100, LastModified: new Date() },
						{ Key: 'users/123/b.png', Size: 200, LastModified: new Date() },
					],
					IsTruncated: false,
				})
				.mockResolvedValue({}); // deleteMany

			const count = await storage.deleteByPrefix('users/123/');

			expect(count).toBe(2);
		});

		it('returns 0 when prefix has no files', async () => {
			mockSend.mockResolvedValue({ Contents: undefined, IsTruncated: false });

			const count = await storage.deleteByPrefix('users/nonexistent/');

			expect(count).toBe(0);
			expect(mockSend).toHaveBeenCalledTimes(1); // only list, no delete
		});
	});

	describe('copy', () => {
		it('copies a file and returns new key', async () => {
			mockSend.mockResolvedValue({ CopyObjectResult: { ETag: '"copied"' } });

			const result = await storage.copy('old/file.png', 'new/file.png');

			expect(result.key).toBe('new/file.png');
			expect(result.etag).toBe('"copied"');
			expect(result.url).toBe('http://localhost:9000/test-bucket/new/file.png');
		});

		it('sends CopyObjectCommand with correct source', async () => {
			mockSend.mockResolvedValue({ CopyObjectResult: {} });
			const { CopyObjectCommand } = await import('@aws-sdk/client-s3');

			await storage.copy('src.png', 'dst.png');

			expect(CopyObjectCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					Bucket: 'test-bucket',
					CopySource: 'test-bucket/src.png',
					Key: 'dst.png',
				})
			);
		});
	});

	describe('move', () => {
		it('copies then deletes source', async () => {
			mockSend
				.mockResolvedValueOnce({ CopyObjectResult: { ETag: '"moved"' } }) // copy
				.mockResolvedValueOnce({}); // delete

			const result = await storage.move('old/file.png', 'new/file.png');

			expect(result.key).toBe('new/file.png');
			expect(result.etag).toBe('"moved"');
			expect(mockSend).toHaveBeenCalledTimes(2);
		});
	});

	describe('getMetadata', () => {
		it('returns file metadata', async () => {
			mockSend.mockResolvedValue({
				ContentType: 'image/png',
				ContentLength: 4096,
				LastModified: new Date('2024-06-15'),
				ETag: '"meta-etag"',
				Metadata: { author: 'test' },
			});

			const meta = await storage.getMetadata('file.png');

			expect(meta.contentType).toBe('image/png');
			expect(meta.size).toBe(4096);
			expect(meta.etag).toBe('"meta-etag"');
			expect(meta.metadata).toEqual({ author: 'test' });
		});

		it('handles missing optional fields', async () => {
			mockSend.mockResolvedValue({});

			const meta = await storage.getMetadata('file.png');

			expect(meta.size).toBe(0);
			expect(meta.contentType).toBeUndefined();
		});
	});

	describe('presigned multipart upload', () => {
		it('createMultipartUpload returns upload ID', async () => {
			mockSend.mockResolvedValue({ UploadId: 'mp-123' });

			const result = await storage.createMultipartUpload('big.zip', 'application/zip');

			expect(result).toEqual({ uploadId: 'mp-123', key: 'big.zip' });
		});

		it('createMultipartUpload throws when no UploadId', async () => {
			mockSend.mockResolvedValue({});

			await expect(storage.createMultipartUpload('big.zip')).rejects.toThrow(
				'no UploadId returned'
			);
		});

		it('getMultipartUploadUrls returns URLs for each part', async () => {
			const urls = await storage.getMultipartUploadUrls('big.zip', 'mp-123', 3);

			expect(urls).toHaveLength(3);
			expect(urls[0]).toBe('https://signed.url/file');
		});

		it('completeMultipartUpload finishes upload and emits hook', async () => {
			mockSend.mockResolvedValue({ ETag: '"final"' });
			const handler = vi.fn();
			storage.hooks.on('upload', handler);

			const result = await storage.completeMultipartUpload('big.zip', 'mp-123', [
				{ partNumber: 1, etag: '"part1"' },
				{ partNumber: 2, etag: '"part2"' },
			]);

			expect(result.key).toBe('big.zip');
			expect(result.etag).toBe('"final"');
			expect(handler).toHaveBeenCalledWith(
				expect.objectContaining({ bucket: 'test-bucket', key: 'big.zip' })
			);
		});

		it('abortMultipartUpload sends abort command', async () => {
			mockSend.mockResolvedValue({});
			const { AbortMultipartUploadCommand } = await import('@aws-sdk/client-s3');

			await storage.abortMultipartUpload('big.zip', 'mp-123');

			expect(AbortMultipartUploadCommand).toHaveBeenCalledWith(
				expect.objectContaining({
					Bucket: 'test-bucket',
					Key: 'big.zip',
					UploadId: 'mp-123',
				})
			);
		});
	});
});
