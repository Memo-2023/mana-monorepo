/**
 * Notes module types.
 *
 * Lightweight markdown notes — flat structure, no folders.
 */

import type { BaseRecord } from '@manacore/local-store';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalNote extends BaseRecord {
	title: string;
	content: string;
	color: string | null;
	isPinned: boolean;
	isArchived: boolean;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Note {
	id: string;
	title: string;
	content: string;
	color: string | null;
	isPinned: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const NOTE_COLORS: (string | null)[] = [
	null,
	'#ef4444',
	'#f97316',
	'#f59e0b',
	'#84cc16',
	'#22c55e',
	'#06b6d4',
	'#3b82f6',
	'#6366f1',
	'#8b5cf6',
	'#ec4899',
];
