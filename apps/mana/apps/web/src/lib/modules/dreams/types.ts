/**
 * Dreams module types — Traumtagebuch.
 */

import type { BaseRecord } from '@mana/local-store';

export type DreamMood = 'angenehm' | 'neutral' | 'unangenehm' | 'albtraum';
export type DreamClarity = 1 | 2 | 3 | 4 | 5;
export type SleepQuality = 1 | 2 | 3 | 4 | 5;

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalDream extends BaseRecord {
	title: string | null;
	content: string;
	dreamDate: string; // ISO date (YYYY-MM-DD) — die Nacht, in der geträumt wurde
	mood: DreamMood | null;
	clarity: DreamClarity | null;
	isLucid: boolean;
	isRecurring: boolean;
	sleepQuality: SleepQuality | null;
	bedtime: string | null; // ISO time (HH:mm)
	wakeTime: string | null; // ISO time (HH:mm)
	location: string | null;
	people: string[];
	emotions: string[];
	symbols: string[];
	audioPath: string | null;
	transcript: string | null;
	interpretation: string | null;
	aiInterpretation: string | null;
	isPrivate: boolean;
	isPinned: boolean;
	isArchived: boolean;
}

export interface LocalDreamSymbol extends BaseRecord {
	name: string;
	meaning: string | null;
	color: string | null;
	count: number;
}

export interface LocalDreamTag extends BaseRecord {
	dreamId: string;
	tagId: string;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Dream {
	id: string;
	title: string | null;
	content: string;
	dreamDate: string;
	mood: DreamMood | null;
	clarity: DreamClarity | null;
	isLucid: boolean;
	isRecurring: boolean;
	sleepQuality: SleepQuality | null;
	bedtime: string | null;
	wakeTime: string | null;
	location: string | null;
	people: string[];
	emotions: string[];
	symbols: string[];
	audioPath: string | null;
	transcript: string | null;
	interpretation: string | null;
	aiInterpretation: string | null;
	isPrivate: boolean;
	isPinned: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface DreamSymbol {
	id: string;
	name: string;
	meaning: string | null;
	color: string | null;
	count: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const MOOD_COLORS: Record<DreamMood, string> = {
	angenehm: '#22c55e',
	neutral: '#9ca3af',
	unangenehm: '#f59e0b',
	albtraum: '#ef4444',
};

export const MOOD_LABELS: Record<DreamMood, string> = {
	angenehm: 'Angenehm',
	neutral: 'Neutral',
	unangenehm: 'Unangenehm',
	albtraum: 'Albtraum',
};
