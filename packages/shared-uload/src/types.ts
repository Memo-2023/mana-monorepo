import type { BaseRecord } from '@manacore/local-store';

export interface UloadLink extends BaseRecord {
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

export interface CreateShortLinkOptions {
	url: string;
	title?: string;
	customCode?: string;
	source: string;
	tags?: string[];
	expiresAt?: string;
	description?: string;
}

export interface CreatedLink {
	id: string;
	shortCode: string;
	shortUrl: string;
	qrCodeUrl: string;
}

export type AppSource =
	| 'calendar'
	| 'contacts'
	| 'todo'
	| 'chat'
	| 'storage'
	| 'presi'
	| 'mukke'
	| 'cards'
	| 'picture'
	| 'uload'
	| 'manacore'
	| (string & {});

export const APP_SOURCE_LABELS: Record<string, string> = {
	calendar: 'Kalender',
	contacts: 'Kontakte',
	todo: 'Todo',
	chat: 'Chat',
	storage: 'Storage',
	presi: 'Presi',
	mukke: 'Mukke',
	cards: 'Cards',
	picture: 'Picture',
	uload: 'uLoad',
	manacore: 'ManaCore',
};
