/**
 * Periods module types — Menstruationszyklus-Tracking.
 */

import type { BaseRecord } from '@mana/local-store';

export type Flow = 'none' | 'spotting' | 'light' | 'medium' | 'heavy';
export type Mood = 'great' | 'good' | 'neutral' | 'low' | 'bad';
export type CervicalMucus = 'dry' | 'sticky' | 'creamy' | 'watery' | 'eggwhite';
export type SymptomCategory = 'physical' | 'emotional' | 'other';
export type PeriodPhase = 'menstruation' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

// ─── Local Record Types (Dexie) ───────────────────────────

export interface LocalPeriod extends BaseRecord {
	startDate: string; // ISO YYYY-MM-DD — erster Tag der Periode
	periodEndDate: string | null; // letzter Tag der Blutung
	endDate: string | null; // Tag vor dem nächsten Zyklusstart (berechnet)
	length: number | null; // Zykluslänge in Tagen
	isPredicted: boolean;
	isArchived: boolean;
	notes: string | null;
	timeBlockId?: string | null; // link to timeBlocks table (menstruation phase)
}

export interface LocalPeriodDayLog extends BaseRecord {
	logDate: string; // ISO YYYY-MM-DD
	periodId: string | null;
	flow: Flow;
	mood: Mood | null;
	energy: number | null; // 1..5
	temperature: number | null; // °C, BBT
	cervicalMucus: CervicalMucus | null;
	symptoms: string[]; // periodSymptom.id refs
	sexualActivity: boolean | null;
	notes: string | null;
}

export interface LocalPeriodSymptom extends BaseRecord {
	name: string;
	category: SymptomCategory;
	color: string | null;
	count: number;
}

// ─── Domain Types ─────────────────────────────────────────

export interface Period {
	id: string;
	startDate: string;
	periodEndDate: string | null;
	endDate: string | null;
	length: number | null;
	isPredicted: boolean;
	isArchived: boolean;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PeriodDayLog {
	id: string;
	logDate: string;
	periodId: string | null;
	flow: Flow;
	mood: Mood | null;
	energy: number | null;
	temperature: number | null;
	cervicalMucus: CervicalMucus | null;
	symptoms: string[];
	sexualActivity: boolean | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface PeriodSymptom {
	id: string;
	name: string;
	category: SymptomCategory;
	color: string | null;
	count: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ────────────────────────────────────────────

export const FLOW_COLORS: Record<Flow, string> = {
	none: 'rgba(0,0,0,0.08)',
	spotting: '#fda4af',
	light: '#fb7185',
	medium: '#e11d48',
	heavy: '#9f1239',
};

export const FLOW_LABELS: Record<Flow, string> = {
	none: 'Keine',
	spotting: 'Schmierblutung',
	light: 'Leicht',
	medium: 'Mittel',
	heavy: 'Stark',
};

export const MOOD_LABELS: Record<Mood, string> = {
	great: 'Großartig',
	good: 'Gut',
	neutral: 'Neutral',
	low: 'Niedrig',
	bad: 'Schlecht',
};

export const MOOD_COLORS: Record<Mood, string> = {
	great: '#22c55e',
	good: '#84cc16',
	neutral: '#9ca3af',
	low: '#f59e0b',
	bad: '#ef4444',
};

export const PHASE_LABELS: Record<PeriodPhase, string> = {
	menstruation: 'Menstruation',
	follicular: 'Follikelphase',
	ovulation: 'Eisprung',
	luteal: 'Lutealphase',
	unknown: 'Unbekannt',
};

export const PHASE_COLORS: Record<PeriodPhase, string> = {
	menstruation: '#e11d48',
	follicular: '#f59e0b',
	ovulation: '#22c55e',
	luteal: '#8b5cf6',
	unknown: '#9ca3af',
};

export const CERVICAL_MUCUS_LABELS: Record<CervicalMucus, string> = {
	dry: 'Trocken',
	sticky: 'Klebrig',
	creamy: 'Cremig',
	watery: 'Wässrig',
	eggwhite: 'Eiweiß',
};

export const DEFAULT_PERIOD_LENGTH = 28;
export const DEFAULT_BLEEDING_DAYS = 5;
export const DEFAULT_LUTEAL_LENGTH = 14;
