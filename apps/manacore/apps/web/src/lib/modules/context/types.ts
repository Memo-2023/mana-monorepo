/**
 * Context module types for the unified ManaCore app.
 */

import type { BaseRecord } from '@manacore/local-store';

// ─── Document Types ────────────────────────────────────────

export type DocumentType = 'text' | 'context' | 'prompt';

export interface DocumentMetadata {
	tags?: string[];
	word_count?: number;
	token_count?: number;
	parent_document?: string;
	version?: number;
	generation_type?: 'summary' | 'continuation' | 'rewrite' | 'ideas';
	model_used?: string;
	prompt_used?: string;
	original_title?: string;
	version_history?: Array<{
		id: string;
		title: string;
		type: string;
		created_at: string;
		is_original: boolean;
	}>;
	[key: string]: unknown;
}

// ─── Local DB Types (IndexedDB) ────────────────────────────

export interface LocalContextSpace extends BaseRecord {
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
	type: DocumentType;
	shortId?: string | null;
	pinned: boolean;
	metadata?: {
		tags?: string[];
		wordCount?: number;
	} | null;
}

// ─── Shared / View Types ───────────────────────────────────

export interface Space {
	id: string;
	name: string;
	description: string | null;
	user_id: string;
	created_at: string;
	settings: Record<string, unknown> | null;
	pinned: boolean;
	prefix?: string;
}

export interface Document {
	id: string;
	title: string;
	content: string | null;
	type: DocumentType;
	space_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	metadata: DocumentMetadata | null;
	short_id?: string;
	pinned?: boolean;
}
