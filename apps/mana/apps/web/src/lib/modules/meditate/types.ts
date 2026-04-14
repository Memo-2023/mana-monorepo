/**
 * Meditate module types — meditation timer, breathing exercises, body scans.
 *
 * Tables:
 *   meditatePresets   — predefined & custom meditation/breathing templates
 *   meditateSessions  — completed meditation sessions
 *   meditateSettings  — per-user preferences (bell sound, theme, etc.)
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Enums / unions ─────────────────────────────────────────

export type MeditateCategory = 'silence' | 'breathing' | 'bodyscan';

export type BellSound = 'gong' | 'bowl' | 'bell' | 'none';

export type BackgroundTheme = 'minimal' | 'gradient' | 'dark';

// ─── Embedded Types ─────────────────────────────────────────

/** Breathing pattern — all values in seconds. */
export interface BreathPattern {
	inhale: number;
	hold1: number;
	exhale: number;
	hold2: number;
}

/** Which phase of a breath cycle we're in. */
export type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

// ─── Local Record Types (Dexie) ─────────────────────────────

export interface LocalMeditatePreset extends BaseRecord {
	name: string;
	description: string;
	category: MeditateCategory;
	/** null for silence and bodyscan presets. */
	breathPattern: BreathPattern | null;
	/** Text steps for body scan (e.g. "Feet", "Legs", …). null for other categories. */
	bodyScanSteps: string[] | null;
	defaultDurationSec: number;
	/** Built-in seed vs. user-created. */
	isPreset: boolean;
	isArchived: boolean;
	order: number;
}

export interface LocalMeditateSession extends BaseRecord {
	presetId: string | null;
	/** Denormalized for stats queries without join. */
	category: MeditateCategory;
	startedAt: string;
	durationSec: number;
	completed: boolean;
	moodBefore: number | null;
	moodAfter: number | null;
	notes: string | null;
}

export interface LocalMeditateSettings extends BaseRecord {
	bellSound: BellSound;
	intervalBell: boolean;
	intervalSeconds: number;
	showBreathGuide: boolean;
	backgroundTheme: BackgroundTheme;
}

// ─── Domain Types (UI-facing) ───────────────────────────────

export interface MeditatePreset {
	id: string;
	name: string;
	description: string;
	category: MeditateCategory;
	breathPattern: BreathPattern | null;
	bodyScanSteps: string[] | null;
	defaultDurationSec: number;
	isPreset: boolean;
	isArchived: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface MeditateSession {
	id: string;
	presetId: string | null;
	category: MeditateCategory;
	startedAt: string;
	durationSec: number;
	completed: boolean;
	moodBefore: number | null;
	moodAfter: number | null;
	notes: string | null;
	createdAt: string;
}

export interface MeditateSettings {
	id: string;
	bellSound: BellSound;
	intervalBell: boolean;
	intervalSeconds: number;
	showBreathGuide: boolean;
	backgroundTheme: BackgroundTheme;
}

// ─── Constants ──────────────────────────────────────────────

export const MEDITATE_CATEGORIES: readonly MeditateCategory[] = [
	'silence',
	'breathing',
	'bodyscan',
] as const;

export const CATEGORY_LABELS: Record<MeditateCategory, { de: string; en: string }> = {
	silence: { de: 'Stille', en: 'Silence' },
	breathing: { de: 'Atemübung', en: 'Breathing' },
	bodyscan: { de: 'Body Scan', en: 'Body Scan' },
};

export const BELL_SOUND_LABELS: Record<BellSound, { de: string; en: string }> = {
	gong: { de: 'Gong', en: 'Gong' },
	bowl: { de: 'Klangschale', en: 'Singing Bowl' },
	bell: { de: 'Glocke', en: 'Bell' },
	none: { de: 'Aus', en: 'Off' },
};

export const BREATH_PHASE_LABELS: Record<BreathPhase, { de: string; en: string }> = {
	inhale: { de: 'Einatmen', en: 'Inhale' },
	hold1: { de: 'Halten', en: 'Hold' },
	exhale: { de: 'Ausatmen', en: 'Exhale' },
	hold2: { de: 'Halten', en: 'Hold' },
};

export const DEFAULT_SETTINGS: Omit<LocalMeditateSettings, keyof BaseRecord> = {
	bellSound: 'gong',
	intervalBell: false,
	intervalSeconds: 300,
	showBreathGuide: true,
	backgroundTheme: 'minimal',
};
