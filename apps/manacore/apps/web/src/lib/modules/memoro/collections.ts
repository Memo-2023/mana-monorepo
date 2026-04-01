/**
 * Memoro module — collection accessors and guest seed data.
 *
 * Table names: memos, memories, memoroTags, memoTags, memoroSpaces, spaceMembers, memoSpaces
 */

import { db } from '$lib/data/database';
import type {
	LocalMemo,
	LocalMemory,
	LocalTag,
	LocalMemoTag,
	LocalSpace,
	LocalSpaceMember,
	LocalMemoSpace,
} from './types';

// ─── Collection Accessors ──────────────────────────────────

export const memoTable = db.table<LocalMemo>('memos');
export const memoryTable = db.table<LocalMemory>('memories');
export const memoroTagTable = db.table<LocalTag>('memoroTags');
export const memoTagTable = db.table<LocalMemoTag>('memoTags');
export const memoroSpaceTable = db.table<LocalSpace>('memoroSpaces');
export const spaceMemberTable = db.table<LocalSpaceMember>('spaceMembers');
export const memoSpaceTable = db.table<LocalMemoSpace>('memoSpaces');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_MEMO_ID = 'demo-welcome-memo';

export const MEMORO_GUEST_SEED = {
	memos: [
		{
			id: DEMO_MEMO_ID,
			title: 'Willkommen bei Memoro',
			intro: 'Dies ist ein Beispiel-Memo zum Kennenlernen.',
			transcript:
				'Memoro ist dein AI-gestützter Sprachrekorder und Memo-Manager. Nimm Gedanken auf, lass sie transkribieren und erstelle Erinnerungen daraus.',
			audioDurationMs: null,
			processingStatus: 'completed' as const,
			isArchived: false,
			isPinned: true,
			isPublic: false,
			blueprintId: null,
			language: 'de',
		},
	],
	memories: [
		{
			id: 'demo-memory-1',
			memoId: DEMO_MEMO_ID,
			title: 'Kernfunktionen',
			content:
				'Memoro bietet Sprachaufnahme, automatische Transkription, KI-gestützte Zusammenfassungen und Tagging.',
		},
	],
	memoroTags: [
		{
			id: 'tag-ideen',
			name: 'Ideen',
			color: '#3b82f6',
			isPinned: true,
			sortOrder: 0,
		},
		{
			id: 'tag-notizen',
			name: 'Notizen',
			color: '#10b981',
			isPinned: false,
			sortOrder: 1,
		},
	],
	memoTags: [
		{
			id: 'mt-demo-1',
			memoId: DEMO_MEMO_ID,
			tagId: 'tag-notizen',
		},
	],
	memoroSpaces: [] as Record<string, unknown>[],
	spaceMembers: [] as Record<string, unknown>[],
	memoSpaces: [] as Record<string, unknown>[],
};
