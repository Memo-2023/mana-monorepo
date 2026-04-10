/**
 * Journal module types — Tagebuch.
 */

import type { BaseRecord } from '@mana/local-store';

export type JournalMood =
	| 'dankbar'
	| 'glücklich'
	| 'zufrieden'
	| 'neutral'
	| 'nachdenklich'
	| 'traurig'
	| 'gestresst'
	| 'wütend';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalJournalEntry extends BaseRecord {
	title: string | null;
	content: string;
	entryDate: string; // ISO date (YYYY-MM-DD)
	mood: JournalMood | null;
	tags: string[];
	isPinned: boolean;
	isArchived: boolean;
	isFavorite: boolean;
	wordCount: number;
	/** STT backend/model identifier. Set when entry created via voice. */
	transcriptModel?: string | null;
}

// ─── Domain Types ─────────────────────────────────────────

export interface JournalEntry {
	id: string;
	title: string | null;
	content: string;
	entryDate: string;
	mood: JournalMood | null;
	tags: string[];
	isPinned: boolean;
	isArchived: boolean;
	isFavorite: boolean;
	wordCount: number;
	transcriptModel: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const MOOD_COLORS: Record<JournalMood, string> = {
	dankbar: '#22c55e',
	glücklich: '#f59e0b',
	zufrieden: '#3b82f6',
	neutral: '#9ca3af',
	nachdenklich: '#8b5cf6',
	traurig: '#6366f1',
	gestresst: '#ef4444',
	wütend: '#dc2626',
};

export const MOOD_LABELS: Record<JournalMood, string> = {
	dankbar: 'Dankbar',
	glücklich: 'Glücklich',
	zufrieden: 'Zufrieden',
	neutral: 'Neutral',
	nachdenklich: 'Nachdenklich',
	traurig: 'Traurig',
	gestresst: 'Gestresst',
	wütend: 'Wütend',
};

export const MOOD_EMOJI: Record<JournalMood, string> = {
	dankbar: '\u{1f64f}',
	glücklich: '\u{1f60a}',
	zufrieden: '\u{263a}\u{fe0f}',
	neutral: '\u{1f610}',
	nachdenklich: '\u{1f914}',
	traurig: '\u{1f614}',
	gestresst: '\u{1f62b}',
	wütend: '\u{1f621}',
};
