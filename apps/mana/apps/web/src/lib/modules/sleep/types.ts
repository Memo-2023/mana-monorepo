/**
 * Sleep module types — sleep tracking with hygiene checklists.
 *
 * Tables:
 *   sleepEntries       — one row per night (bedtime → wake)
 *   sleepHygieneLogs   — evening hygiene checklist completion
 *   sleepHygieneChecks — configurable hygiene check definitions
 *   sleepSettings      — singleton user preferences (goal, reminders)
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Enums / unions ─────────────────────────────────────────

export type HygieneCategory =
	| 'nutrition'
	| 'digital'
	| 'environment'
	| 'routine'
	| 'consistency'
	| 'custom';

// ─── Local Record Types (Dexie) ─────────────────────────────

export interface LocalSleepEntry extends BaseRecord {
	/** YYYY-MM-DD of the night (= date of falling asleep). */
	date: string;
	/** ISO datetime — when went to bed. */
	bedtime: string;
	/** ISO datetime — when woke up. */
	wakeTime: string;
	/** Calculated sleep duration in minutes. */
	durationMin: number;
	/** Minutes to fall asleep (optional). */
	sleepLatencyMin: number | null;
	/** Number of night-time awakenings. */
	interruptions: number;
	/** Total duration of interruptions in minutes. */
	interruptionDurationMin: number;
	/** Sleep quality 1–5. */
	quality: number;
	/** Woke up rested? 1–5 (optional). */
	restedness: number | null;
	/** Free-text notes. */
	notes: string;
	/** Tags (e.g. "nightmare", "jetlag", "medication"). */
	tags: string[];
	/** Links to Dreams module entries. */
	dreamIds: string[];
}

export interface LocalSleepHygieneLog extends BaseRecord {
	/** YYYY-MM-DD */
	date: string;
	/** IDs of completed checks. */
	completedCheckIds: string[];
	/** Score 0–100 (% of active checks completed). */
	score: number;
}

export interface LocalSleepHygieneCheck extends BaseRecord {
	name: string;
	description: string;
	category: HygieneCategory;
	isActive: boolean;
	isPreset: boolean;
	order: number;
}

export interface LocalSleepSettings extends BaseRecord {
	/** Sleep goal in minutes (default: 480 = 8h). */
	goalMin: number;
	/** Target bedtime HH:mm. */
	targetBedtime: string;
	/** Target wake time HH:mm. */
	targetWakeTime: string;
	/** Reminder: minutes before bedtime (0 = off). */
	bedtimeReminderMin: number;
	/** Morning log reminder active. */
	morningReminderEnabled: boolean;
	/** Morning log reminder time HH:mm. */
	morningReminderTime: string;
}

// ─── Domain Types (UI-facing) ───────────────────────────────

export interface SleepEntry {
	id: string;
	date: string;
	bedtime: string;
	wakeTime: string;
	durationMin: number;
	sleepLatencyMin: number | null;
	interruptions: number;
	interruptionDurationMin: number;
	quality: number;
	restedness: number | null;
	notes: string;
	tags: string[];
	dreamIds: string[];
	createdAt: string;
	updatedAt: string;
}

export interface SleepHygieneLog {
	id: string;
	date: string;
	completedCheckIds: string[];
	score: number;
	createdAt: string;
}

export interface SleepHygieneCheck {
	id: string;
	name: string;
	description: string;
	category: HygieneCategory;
	isActive: boolean;
	isPreset: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface SleepSettings {
	id: string;
	goalMin: number;
	targetBedtime: string;
	targetWakeTime: string;
	bedtimeReminderMin: number;
	morningReminderEnabled: boolean;
	morningReminderTime: string;
}

// ─── Constants ──────────────────────────────────────────────

export const HYGIENE_CATEGORIES: readonly HygieneCategory[] = [
	'nutrition',
	'digital',
	'environment',
	'routine',
	'consistency',
	'custom',
] as const;

export const HYGIENE_CATEGORY_LABELS: Record<HygieneCategory, { de: string; en: string }> = {
	nutrition: { de: 'Ernährung', en: 'Nutrition' },
	digital: { de: 'Digital', en: 'Digital' },
	environment: { de: 'Umgebung', en: 'Environment' },
	routine: { de: 'Routine', en: 'Routine' },
	consistency: { de: 'Konsistenz', en: 'Consistency' },
	custom: { de: 'Eigene', en: 'Custom' },
};

export const QUALITY_LABELS: Record<number, { de: string; en: string }> = {
	1: { de: 'Sehr schlecht', en: 'Very poor' },
	2: { de: 'Schlecht', en: 'Poor' },
	3: { de: 'Okay', en: 'Okay' },
	4: { de: 'Gut', en: 'Good' },
	5: { de: 'Sehr gut', en: 'Very good' },
};

export const SLEEP_TAG_PRESETS = [
	'Alptraum',
	'Klartraum',
	'Jetlag',
	'Schichtarbeit',
	'Mittagsschlaf',
	'Medikament',
	'Krank',
	'Stress',
	'Sport abends',
	'Alkohol',
] as const;

export const DEFAULT_SLEEP_SETTINGS: Omit<LocalSleepSettings, keyof BaseRecord> = {
	goalMin: 480,
	targetBedtime: '23:00',
	targetWakeTime: '07:00',
	bedtimeReminderMin: 30,
	morningReminderEnabled: true,
	morningReminderTime: '08:00',
};
