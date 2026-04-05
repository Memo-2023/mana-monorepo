/**
 * uLoad module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

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
