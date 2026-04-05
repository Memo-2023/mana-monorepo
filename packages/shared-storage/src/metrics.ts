import type { StorageHooks } from './hooks';

/**
 * Minimal interface matching MetricsService.createCounter/createHistogram.
 * This avoids a hard dependency on @mana/shared-nestjs-metrics or prom-client.
 */
export interface MetricsFactory {
	createCounter(name: string, help: string, labelNames?: string[]): CounterLike;
	createHistogram(
		name: string,
		help: string,
		labelNames?: string[],
		buckets?: number[]
	): HistogramLike;
}

interface CounterLike {
	inc(labels?: Record<string, string | number>, value?: number): void;
}

interface HistogramLike {
	observe(labels: Record<string, string | number>, value: number): void;
}

/**
 * Interface for a metrics collector — decoupled from prom-client so shared-storage
 * stays dependency-free. NestJS backends wire this up with their MetricsService.
 */
export interface StorageMetricsCollector {
	incrementUploads(bucket: string, contentType?: string): void;
	incrementUploadErrors(bucket: string): void;
	incrementDeletes(bucket: string, count: number): void;
	incrementDownloads(bucket: string): void;
	observeUploadSize(bucket: string, sizeBytes: number): void;
}

/**
 * In-memory metrics collector for environments without Prometheus.
 * Useful for testing and local development.
 */
export class InMemoryMetrics implements StorageMetricsCollector {
	readonly counters = {
		uploads: 0,
		uploadErrors: 0,
		deletes: 0,
		downloads: 0,
	};
	readonly sizes: number[] = [];

	incrementUploads(_bucket: string, _contentType?: string): void {
		this.counters.uploads++;
	}
	incrementUploadErrors(_bucket: string): void {
		this.counters.uploadErrors++;
	}
	incrementDeletes(_bucket: string, count: number): void {
		this.counters.deletes += count;
	}
	incrementDownloads(_bucket: string): void {
		this.counters.downloads++;
	}
	observeUploadSize(_bucket: string, sizeBytes: number): void {
		this.sizes.push(sizeBytes);
	}

	reset(): void {
		this.counters.uploads = 0;
		this.counters.uploadErrors = 0;
		this.counters.deletes = 0;
		this.counters.downloads = 0;
		this.sizes.length = 0;
	}
}

/**
 * Wires a StorageMetricsCollector to StorageHooks.
 * Call this once after creating the hooks + collector to auto-track metrics.
 *
 * @example
 * const hooks = new StorageHooks();
 * const collector = createPrometheusCollector(metricsService);
 * attachMetrics(hooks, collector);
 */
export function attachMetrics(hooks: StorageHooks, collector: StorageMetricsCollector): () => void {
	const unsubs = [
		hooks.on('upload', (payload) => {
			collector.incrementUploads(payload.bucket, payload.contentType);
			if (payload.sizeBytes != null) {
				collector.observeUploadSize(payload.bucket, payload.sizeBytes);
			}
		}),
		hooks.on('upload:error', (payload) => {
			collector.incrementUploadErrors(payload.bucket);
		}),
		hooks.on('delete', (payload) => {
			collector.incrementDeletes(payload.bucket, payload.keys.length);
		}),
		hooks.on('download', (payload) => {
			collector.incrementDownloads(payload.bucket);
		}),
	];

	return () => unsubs.forEach((unsub) => unsub());
}

/**
 * Create a StorageMetricsCollector backed by Prometheus counters/histograms.
 * Pass your NestJS MetricsService (or anything that matches MetricsFactory).
 *
 * @example
 * // In a NestJS service
 * import { MetricsService } from '@mana/shared-nestjs-metrics';
 * import { createPrometheusCollector, attachMetrics } from '@mana/shared-storage';
 *
 * const storage = createPictureStorage();
 * const collector = createPrometheusCollector(metricsService);
 * attachMetrics(storage.hooks, collector);
 */
export function createPrometheusCollector(factory: MetricsFactory): StorageMetricsCollector {
	const uploadsCounter = factory.createCounter(
		'storage_uploads_total',
		'Total storage upload operations',
		['bucket', 'content_type']
	);

	const uploadErrorsCounter = factory.createCounter(
		'storage_upload_errors_total',
		'Total storage upload errors',
		['bucket']
	);

	const deletesCounter = factory.createCounter(
		'storage_deletes_total',
		'Total storage delete operations',
		['bucket']
	);

	const downloadsCounter = factory.createCounter(
		'storage_downloads_total',
		'Total storage download operations',
		['bucket']
	);

	const uploadSizeHistogram = factory.createHistogram(
		'storage_upload_size_bytes',
		'Upload file sizes in bytes',
		['bucket'],
		[1024, 10240, 102400, 1048576, 10485760, 104857600] // 1KB, 10KB, 100KB, 1MB, 10MB, 100MB
	);

	return {
		incrementUploads(bucket: string, contentType?: string): void {
			uploadsCounter.inc({ bucket, content_type: contentType ?? 'unknown' });
		},
		incrementUploadErrors(bucket: string): void {
			uploadErrorsCounter.inc({ bucket });
		},
		incrementDeletes(bucket: string, count: number): void {
			deletesCounter.inc({ bucket }, count);
		},
		incrementDownloads(bucket: string): void {
			downloadsCounter.inc({ bucket });
		},
		observeUploadSize(bucket: string, sizeBytes: number): void {
			uploadSizeHistogram.observe({ bucket }, sizeBytes);
		},
	};
}
