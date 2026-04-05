/**
 * Mana Spiral Store
 *
 * Unified cross-app spiral visualization.
 * Collects activity snapshots from all apps' IndexedDB collections
 * and encodes them into a single SpiralDB image.
 */

import {
	SpiralDB,
	createManaActivitySchema,
	MANA_APP_INDEX,
	MANA_APP_NAMES,
	MANA_EVENT_TYPE,
	MANA_EVENT_NAMES,
	type SpiralImage,
	type SpiralRecord,
	exportToPngBytes,
	importFromPngBytes,
	downloadPng,
} from '@mana/spiral-db';

// ─── Types ─────────────────────────────────────────────────

export interface ManaActivityData extends Record<string, unknown> {
	id: number;
	app: number;
	eventType: number;
	value: number;
	createdAt: Date;
	label: string;
}

export interface ManaActivityRecord extends SpiralRecord<ManaActivityData> {}

export interface ManaSpiralStats {
	imageSize: number;
	totalPixels: number;
	usedPixels: number;
	totalRecords: number;
	activeRecords: number;
	deletedRecords: number;
	currentRing: number;
	compressionRatio: number;
}

export interface AppSnapshot {
	app: string;
	appIndex: number;
	totalItems: number;
	completedItems: number;
	favoriteItems: number;
	label: string;
}

// ─── Store ─────────────────────────────────────────────────

class ManaSpiralStore {
	private db: SpiralDB<ManaActivityData>;

	image = $state<SpiralImage | null>(null);
	stats = $state<ManaSpiralStats | null>(null);
	records = $state<ManaActivityRecord[]>([]);
	snapshots = $state<AppSnapshot[]>([]);
	isLoading = $state(false);
	error = $state<string | null>(null);
	lastCollectedAt = $state<Date | null>(null);

	constructor() {
		this.db = new SpiralDB<ManaActivityData>({
			schema: createManaActivitySchema(),
			compression: true,
		});
		this.updateState();
	}

	private updateState() {
		this.image = this.db.getImage();
		this.records = this.db.getAll();

		const dbStats = this.db.getStats();
		const jsonSize = JSON.stringify(this.records.map((r) => r.data)).length || 1;
		const pixelBytes = Math.ceil((dbStats.usedPixels * 3) / 8);

		this.stats = {
			...dbStats,
			compressionRatio: Math.round((1 - pixelBytes / jsonSize) * 100),
		};
	}

	/**
	 * Collect snapshots from cross-app readers and build the spiral.
	 * Each app contributes a snapshot event with its item counts.
	 */
	collectFromApps(appSnapshots: AppSnapshot[]) {
		// Reset DB with fresh data
		this.db = new SpiralDB<ManaActivityData>({
			schema: createManaActivitySchema(),
			compression: true,
		});

		this.snapshots = appSnapshots;
		const now = new Date();

		for (const snap of appSnapshots) {
			if (snap.totalItems === 0) continue;

			// Snapshot event: total count
			this.db.insert({
				id: 0,
				app: snap.appIndex,
				eventType: MANA_EVENT_TYPE.snapshot,
				value: snap.totalItems,
				createdAt: now,
				label: snap.label,
			});

			// Completed event (if any)
			if (snap.completedItems > 0) {
				this.db.insert({
					id: 0,
					app: snap.appIndex,
					eventType: MANA_EVENT_TYPE.completed,
					value: snap.completedItems,
					createdAt: now,
					label: `${snap.app}: ${snap.completedItems} erledigt`,
				});
			}

			// Favorites event (if any)
			if (snap.favoriteItems > 0) {
				this.db.insert({
					id: 0,
					app: snap.appIndex,
					eventType: MANA_EVENT_TYPE.favorited,
					value: snap.favoriteItems,
					createdAt: now,
					label: `${snap.app}: ${snap.favoriteItems} Favoriten`,
				});
			}
		}

		this.lastCollectedAt = now;
		this.updateState();
	}

	/**
	 * Get the display name for an app index
	 */
	getAppName(index: number): string {
		return MANA_APP_NAMES[index] ?? 'unknown';
	}

	/**
	 * Get the display name for an event type index
	 */
	getEventName(index: number): string {
		return MANA_EVENT_NAMES[index] ?? 'unknown';
	}

	/**
	 * Get records grouped by app
	 */
	getRecordsByApp(): Map<string, ManaActivityRecord[]> {
		const map = new Map<string, ManaActivityRecord[]>();
		for (const record of this.records) {
			const appName = this.getAppName(record.data.app);
			const list = map.get(appName) ?? [];
			list.push(record);
			map.set(appName, list);
		}
		return map;
	}

	/**
	 * Download spiral as PNG
	 */
	downloadPng(filename = 'mana-spiral.png') {
		if (this.image) {
			downloadPng(this.image, filename);
		}
	}

	/**
	 * Get PNG bytes for sharing
	 */
	getPngBytes(): Uint8Array | null {
		if (!this.image) return null;
		return exportToPngBytes(this.image);
	}

	/**
	 * Import from a PNG file
	 */
	async importFromPng(file: File): Promise<{ success: boolean; error?: string }> {
		try {
			this.isLoading = true;
			this.error = null;

			const buffer = await file.arrayBuffer();
			const bytes = new Uint8Array(buffer);
			const image = await importFromPngBytes(bytes);

			this.db = SpiralDB.fromImage<ManaActivityData>(image, createManaActivitySchema());
			this.updateState();

			return { success: true };
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Unknown error';
			this.error = errorMessage;
			return { success: false, error: errorMessage };
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Clear all data
	 */
	clear() {
		this.db = new SpiralDB<ManaActivityData>({
			schema: createManaActivitySchema(),
			compression: true,
		});
		this.snapshots = [];
		this.lastCollectedAt = null;
		this.updateState();
	}
}

export const manaSpiralStore = new ManaSpiralStore();
