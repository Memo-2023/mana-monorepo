/**
 * Memoro module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

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

// ─── View Types ────────────────────────────────────────────

export interface Memo {
	id: string;
	title: string | null;
	intro: string | null;
	transcript: string | null;
	audioDurationMs: number | null;
	processingStatus: ProcessingStatus;
	isArchived: boolean;
	isPinned: boolean;
	isPublic: boolean;
	language: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Memory {
	id: string;
	memoId: string;
	title: string;
	content: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface Tag {
	id: string;
	name: string;
	color: string | null;
	isPinned: boolean;
	sortOrder: number;
	createdAt: string;
	updatedAt: string;
}

export interface Space {
	id: string;
	name: string;
	description: string | null;
	ownerId: string;
	createdAt: string;
	updatedAt: string;
}
