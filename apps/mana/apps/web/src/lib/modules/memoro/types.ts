/**
 * Memoro module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';
import type { VisibilityLevel } from '@mana/shared-privacy';

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface LocalMemo extends BaseRecord {
	title: string | null;
	intro: string | null;
	transcript: string | null;
	audioDurationMs: number | null;
	transcriptModel: string | null;
	processingStatus: ProcessingStatus;
	isArchived: boolean;
	isPinned: boolean;
	visibility?: VisibilityLevel;
	visibilityChangedAt?: string;
	visibilityChangedBy?: string;
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
	title: string;
	content: string | null;
	metadata?: Record<string, unknown>;
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
	contextSpaceId: string;
	userId: string;
	role: 'owner' | 'member';
}

export interface LocalMemoSpace extends BaseRecord {
	memoId: string;
	contextSpaceId: string;
}

// ─── View Types ────────────────────────────────────────────

export interface Memo {
	id: string;
	title: string | null;
	intro: string | null;
	transcript: string | null;
	audioDurationMs: number | null;
	transcriptModel: string | null;
	processingStatus: ProcessingStatus;
	isArchived: boolean;
	isPinned: boolean;
	visibility: VisibilityLevel;
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

// NOTE: the Tag type used throughout the memoro module comes from
// `@mana/shared-tags`, not from a local definition. A legacy `Tag`
// interface used to live here but was removed because it diverged
// from the shared shape (missing userId, had isPinned/sortOrder that
// nothing reads). Import Tag from '@mana/shared-tags' everywhere.

export interface Space {
	id: string;
	name: string;
	description: string | null;
	ownerId: string;
	createdAt: string;
	updatedAt: string;
}
