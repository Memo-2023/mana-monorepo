import type { UploadResult } from './types';

/**
 * Storage event types
 */
export type StorageEventType = 'upload' | 'upload:error' | 'delete' | 'delete:error' | 'download';

/**
 * Payload for upload events
 */
export interface UploadEventPayload {
	bucket: string;
	key: string;
	sizeBytes?: number;
	contentType?: string;
	result?: UploadResult;
}

/**
 * Payload for delete events
 */
export interface DeleteEventPayload {
	bucket: string;
	keys: string[];
}

/**
 * Payload for download events
 */
export interface DownloadEventPayload {
	bucket: string;
	key: string;
}

/**
 * Payload for error events
 */
export interface ErrorEventPayload {
	bucket: string;
	key?: string;
	error: Error;
}

/**
 * Event payload map
 */
export interface StorageEventMap {
	upload: UploadEventPayload;
	'upload:error': ErrorEventPayload;
	delete: DeleteEventPayload;
	'delete:error': ErrorEventPayload;
	download: DownloadEventPayload;
}

export type StorageHook<T extends StorageEventType> = (payload: StorageEventMap[T]) => void;

/**
 * Simple event emitter for storage lifecycle hooks.
 * Hooks are fire-and-forget — errors in hooks do not affect storage operations.
 */
export class StorageHooks {
	private listeners = new Map<StorageEventType, Set<StorageHook<StorageEventType>>>();

	on<T extends StorageEventType>(event: T, hook: StorageHook<T>): () => void {
		if (!this.listeners.has(event)) {
			this.listeners.set(event, new Set());
		}
		const set = this.listeners.get(event) as Set<StorageHook<T>>;
		set.add(hook);

		// Return unsubscribe function
		return () => set.delete(hook);
	}

	emit<T extends StorageEventType>(event: T, payload: StorageEventMap[T]): void {
		const hooks = this.listeners.get(event);
		if (!hooks) return;

		for (const hook of hooks) {
			try {
				hook(payload);
			} catch {
				// Hooks are fire-and-forget — swallow errors
			}
		}
	}

	removeAll(): void {
		this.listeners.clear();
	}
}
