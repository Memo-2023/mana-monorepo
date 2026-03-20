import type { StorageHooks } from './hooks';

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
