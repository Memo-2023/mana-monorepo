/**
 * Memoro App — Local-First Data Layer
 *
 * Defines the IndexedDB database, collections, and guest seed data.
 * This is the single source of truth for all Memoro data.
 *
 * Migration note: Services are being migrated from direct Supabase queries
 * to this local-first layer. During migration, legacy services coexist.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestMemos, guestTags } from './guest-seed.js';

// ─── Types ──────────────────────────────────────────────────

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LocalMemo extends BaseRecord {
	userId?: string;
	title: string | null;
	intro: string | null;
	transcript: string | null;
	audioDurationMs: number | null;
	processingStatus: ProcessingStatus;
	isArchived: boolean;
	isPinned: boolean;
	isPublic: boolean;
	blueprintId: string | null;
	language: string | null;
	location?: Record<string, unknown>;
	source?: {
		audioPath?: string;
		audioDeleted?: boolean;
		audioDuration?: number;
		transcript?: string;
		utterances?: Array<{
			text: string;
			offset?: number;
			duration?: number;
			speakerId?: string;
		}>;
		speakers?: Record<string, unknown>;
		speakerMap?: Record<string, string>;
		primaryLanguage?: string;
		languages?: string[];
		processing?: {
			transcription?: { status: ProcessingStatus };
			headlineAndIntro?: { status: ProcessingStatus };
		};
		recordingStartedAt?: string;
	};
	metadata?: Record<string, unknown>;
}

export interface LocalMemory extends BaseRecord {
	memoId: string;
	userId?: string;
	title: string;
	content: string | null;
	metadata?: Record<string, unknown>;
}

export interface LocalTag extends BaseRecord {
	name: string;
	color: string | null;
	userId?: string;
	isPinned?: boolean;
	sortOrder?: number;
}

export interface LocalMemoTag extends BaseRecord {
	memoId: string;
	tagId: string;
}

export interface LocalSpace extends BaseRecord {
	name: string;
	description: string | null;
	ownerId: string;
}

export interface LocalSpaceMember extends BaseRecord {
	spaceId: string;
	userId: string;
	role: 'owner' | 'member';
}

export interface LocalMemoSpace extends BaseRecord {
	memoId: string;
	spaceId: string;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const memoroStore = createLocalStore({
	appId: 'memoro',
	collections: [
		{
			name: 'memos',
			indexes: ['processingStatus', 'isArchived', 'isPinned', 'language', '[isArchived+createdAt]'],
			guestSeed: guestMemos,
		},
		{
			name: 'memories',
			indexes: ['memoId'],
		},
		{
			name: 'tags',
			indexes: ['name', 'sortOrder'],
			guestSeed: guestTags,
		},
		{
			name: 'memoTags',
			indexes: ['memoId', 'tagId'],
		},
		{
			name: 'spaces',
			indexes: ['ownerId'],
		},
		{
			name: 'spaceMembers',
			indexes: ['spaceId', 'userId'],
		},
		{
			name: 'memoSpaces',
			indexes: ['memoId', 'spaceId'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const memoCollection = memoroStore.collection<LocalMemo>('memos');
export const memoryCollection = memoroStore.collection<LocalMemory>('memories');
export const tagCollection = memoroStore.collection<LocalTag>('tags');
export const memoTagCollection = memoroStore.collection<LocalMemoTag>('memoTags');
export const spaceCollection = memoroStore.collection<LocalSpace>('spaces');
export const spaceMemberCollection = memoroStore.collection<LocalSpaceMember>('spaceMembers');
export const memoSpaceCollection = memoroStore.collection<LocalMemoSpace>('memoSpaces');
