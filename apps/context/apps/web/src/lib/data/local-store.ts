/**
 * Context — Local-First Data Layer
 *
 * Spaces and documents stored locally.
 * AI generation and token management remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestSpaces, guestDocuments } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalSpace extends BaseRecord {
	name: string;
	description?: string | null;
	settings?: Record<string, unknown> | null;
	pinned: boolean;
	prefix: string;
}

export interface LocalDocument extends BaseRecord {
	spaceId?: string | null;
	title: string;
	content: string;
	type: 'text' | 'context' | 'prompt';
	shortId?: string | null;
	pinned: boolean;
	metadata?: {
		tags?: string[];
		wordCount?: number;
	} | null;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const contextStore = createLocalStore({
	appId: 'context',
	collections: [
		{
			name: 'spaces',
			indexes: ['pinned', 'prefix'],
			guestSeed: guestSpaces,
		},
		{
			name: 'documents',
			indexes: ['spaceId', 'type', 'pinned', 'title', '[spaceId+type]'],
			guestSeed: guestDocuments,
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const spaceCollection = contextStore.collection<LocalSpace>('spaces');
export const documentCollection = contextStore.collection<LocalDocument>('documents');
