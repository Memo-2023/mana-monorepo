/**
 * ManaLink — Cross-App Linking Types
 *
 * Defines the data structures for bidirectional links between records
 * across different apps in the Mana ecosystem.
 */

import type { BaseRecord } from '@mana/local-store';

/** Cached display data for a linked record (offline-friendly). */
export interface LinkCachedData {
	/** Display title of the linked record. */
	title: string;
	/** Optional subtitle (e.g. date, status). */
	subtitle?: string;
	/** App icon (data URL from shared-branding). */
	icon?: string;
	/** App color hex (from shared-branding). */
	color?: string;
	/** Human-readable app name. */
	appName?: string;
	/** ISO timestamp when this cache was built. */
	fetchedAt: string;
}

/** A single link record stored in IndexedDB (mana-links). */
export interface LocalManaLink extends BaseRecord {
	/** UUID shared by the forward and reverse link records. */
	pairId: string;
	/** Direction marker for this half of the pair. */
	direction: 'forward' | 'reverse';
	/** App ID of the source record (e.g. 'todo'). */
	sourceApp: string;
	/** Collection name in the source app (e.g. 'tasks'). */
	sourceCollection: string;
	/** Record ID in the source app. */
	sourceId: string;
	/** App ID of the target record (e.g. 'calendar'). */
	targetApp: string;
	/** Collection name in the target app (e.g. 'events'). */
	targetCollection: string;
	/** Record ID in the target app. */
	targetId: string;
	/** Semantic link type. */
	linkType: string;
	/** Cached display data for the source record. */
	cachedSource?: LinkCachedData;
	/** Cached display data for the target record. */
	cachedTarget?: LinkCachedData;
	/** User ID (for sync scoping). */
	userId?: string;
}

/** Input for creating a link (user-facing). */
export interface CreateManaLinkInput {
	sourceApp: string;
	sourceCollection: string;
	sourceId: string;
	targetApp: string;
	targetCollection: string;
	targetId: string;
	/** Link type. Default: 'related'. */
	linkType?: string;
	cachedSource?: LinkCachedData;
	cachedTarget?: LinkCachedData;
}

/** Identifies a record across apps. */
export interface ManaRecordRef {
	app: string;
	collection: string;
	id: string;
}

/** Built-in link types. */
export type ManaLinkType =
	| 'related'
	| 'blocks'
	| 'blocked-by'
	| 'time-block'
	| 'attachment'
	| 'reference'
	| 'parent'
	| 'child';

/** Map of directional link type inversions. */
export const LINK_TYPE_INVERSIONS: Record<string, string> = {
	blocks: 'blocked-by',
	'blocked-by': 'blocks',
	parent: 'child',
	child: 'parent',
};
