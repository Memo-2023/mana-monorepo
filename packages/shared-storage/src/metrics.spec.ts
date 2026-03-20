import { describe, it, expect, beforeEach } from 'vitest';
import { StorageHooks } from './hooks';
import { InMemoryMetrics, attachMetrics } from './metrics';

describe('InMemoryMetrics', () => {
	let metrics: InMemoryMetrics;

	beforeEach(() => {
		metrics = new InMemoryMetrics();
	});

	it('tracks upload count', () => {
		metrics.incrementUploads('test-bucket');
		metrics.incrementUploads('test-bucket');
		expect(metrics.counters.uploads).toBe(2);
	});

	it('tracks upload errors', () => {
		metrics.incrementUploadErrors('test-bucket');
		expect(metrics.counters.uploadErrors).toBe(1);
	});

	it('tracks deletes with count', () => {
		metrics.incrementDeletes('test-bucket', 5);
		expect(metrics.counters.deletes).toBe(5);
	});

	it('tracks downloads', () => {
		metrics.incrementDownloads('test-bucket');
		expect(metrics.counters.downloads).toBe(1);
	});

	it('records upload sizes', () => {
		metrics.observeUploadSize('test-bucket', 1024);
		metrics.observeUploadSize('test-bucket', 2048);
		expect(metrics.sizes).toEqual([1024, 2048]);
	});

	it('resets all counters', () => {
		metrics.incrementUploads('b');
		metrics.incrementUploadErrors('b');
		metrics.incrementDeletes('b', 3);
		metrics.incrementDownloads('b');
		metrics.observeUploadSize('b', 100);
		metrics.reset();

		expect(metrics.counters.uploads).toBe(0);
		expect(metrics.counters.uploadErrors).toBe(0);
		expect(metrics.counters.deletes).toBe(0);
		expect(metrics.counters.downloads).toBe(0);
		expect(metrics.sizes).toEqual([]);
	});
});

describe('attachMetrics', () => {
	let hooks: StorageHooks;
	let metrics: InMemoryMetrics;

	beforeEach(() => {
		hooks = new StorageHooks();
		metrics = new InMemoryMetrics();
		attachMetrics(hooks, metrics);
	});

	it('tracks uploads via hooks', () => {
		hooks.emit('upload', {
			bucket: 'test',
			key: 'file.png',
			sizeBytes: 512,
			contentType: 'image/png',
		});

		expect(metrics.counters.uploads).toBe(1);
		expect(metrics.sizes).toEqual([512]);
	});

	it('tracks upload errors via hooks', () => {
		hooks.emit('upload:error', {
			bucket: 'test',
			error: new Error('fail'),
		});

		expect(metrics.counters.uploadErrors).toBe(1);
	});

	it('tracks deletes via hooks', () => {
		hooks.emit('delete', {
			bucket: 'test',
			keys: ['a.png', 'b.png'],
		});

		expect(metrics.counters.deletes).toBe(2);
	});

	it('tracks downloads via hooks', () => {
		hooks.emit('download', { bucket: 'test', key: 'file.png' });

		expect(metrics.counters.downloads).toBe(1);
	});

	it('returns detach function', () => {
		const detach = attachMetrics(new StorageHooks(), metrics);
		// No-op on hooks that were attached separately — just verify it doesn't throw
		detach();
	});

	it('skips size tracking when sizeBytes is undefined', () => {
		hooks.emit('upload', { bucket: 'test', key: 'file.png' });

		expect(metrics.counters.uploads).toBe(1);
		expect(metrics.sizes).toEqual([]);
	});
});
