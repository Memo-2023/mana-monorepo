import { createLocalStore, type BaseRecord } from '@manacore/local-store';

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

// ============================================
// Record Types
// ============================================

export interface LocalLink extends BaseRecord {
	shortCode: string;
	customCode?: string | null;
	originalUrl: string;
	title?: string | null;
	description?: string | null;
	isActive: boolean;
	password?: string | null;
	maxClicks?: number | null;
	expiresAt?: string | null;
	clickCount: number;
	qrCodeUrl?: string | null;
	utmSource?: string | null;
	utmMedium?: string | null;
	utmCampaign?: string | null;
	folderId?: string | null;
	order: number;
	source?: string | null;
}

export interface LocalTag extends BaseRecord {
	name: string;
	slug: string;
	color?: string | null;
	icon?: string | null;
	isPublic: boolean;
	usageCount: number;
}

export interface LocalFolder extends BaseRecord {
	name: string;
	color?: string | null;
	order: number;
}

export interface LocalLinkTag extends BaseRecord {
	linkId: string;
	tagId: string;
}

// ============================================
// Guest Seed Data
// ============================================

import { guestLinks, guestTags, guestFolders, guestLinkTags } from './guest-seed';

// ============================================
// Store
// ============================================

export const uloadStore = createLocalStore({
	appId: 'uload',
	collections: [
		{
			name: 'links',
			indexes: [
				'shortCode',
				'isActive',
				'folderId',
				'order',
				'clickCount',
				'source',
				'[folderId+order]',
				'[isActive+order]',
			],
			guestSeed: guestLinks,
		},
		{
			name: 'tags',
			indexes: ['slug', 'name'],
			guestSeed: guestTags,
		},
		{
			name: 'folders',
			indexes: ['order'],
			guestSeed: guestFolders,
		},
		{
			name: 'linkTags',
			indexes: ['linkId', 'tagId', '[linkId+tagId]'],
			guestSeed: guestLinkTags,
		},
	],
	sync: { serverUrl: SYNC_SERVER_URL },
});

// Typed collection accessors
export const linkCollection = uloadStore.collection<LocalLink>('links');
export const tagCollection = uloadStore.collection<LocalTag>('tags');
export const folderCollection = uloadStore.collection<LocalFolder>('folders');
export const linkTagCollection = uloadStore.collection<LocalLinkTag>('linkTags');
