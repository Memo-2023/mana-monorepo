/**
 * Stretch module types — guided stretching routines with mobility assessments.
 *
 * Tables:
 *   stretchExercises   — exercise library (Cat-Cow, Butterfly, …)
 *   stretchRoutines    — saved routine templates (Morgenroutine, Schreibtisch, …)
 *   stretchSessions    — completed stretching sessions
 *   stretchAssessments — mobility self-assessments (periodic)
 *   stretchReminders   — configurable stretch reminder schedules
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Enums / unions ─────────────────────────────────────────

export type BodyRegion =
	| 'neck'
	| 'shoulders'
	| 'upper_back'
	| 'lower_back'
	| 'chest'
	| 'arms'
	| 'wrists'
	| 'hips'
	| 'quads'
	| 'hamstrings'
	| 'calves'
	| 'ankles'
	| 'full_body';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type RoutineType =
	| 'morning'
	| 'desk_break'
	| 'post_workout'
	| 'evening'
	| 'focus_region'
	| 'warm_up'
	| 'custom';

// ─── Embedded Types ─────────────────────────────────────────

/** Single exercise slot inside a routine. */
export interface RoutineExercise {
	exerciseId: string;
	durationSec: number;
	restAfterSec: number;
	notes: string;
}

/** Single test result inside an assessment. */
export interface AssessmentTest {
	testId: string;
	bodyRegion: BodyRegion;
	score: number; // 1–5
	notes: string;
}

/** Pain point marked during an assessment. */
export interface PainRegion {
	region: BodyRegion;
	intensity: number; // 1–10
	description: string;
}

// ─── Local Record Types (Dexie) ─────────────────────────────

export interface LocalStretchExercise extends BaseRecord {
	name: string;
	description: string;
	bodyRegion: BodyRegion;
	difficulty: Difficulty;
	defaultDurationSec: number;
	/** Whether the exercise is done per-side (left/right). */
	bilateral: boolean;
	tags: string[];
	/** Built-in seed vs. user-created. Seeds are not deleteable. */
	isPreset: boolean;
	isArchived: boolean;
	order: number;
}

export interface LocalStretchRoutine extends BaseRecord {
	name: string;
	description: string;
	routineType: RoutineType;
	targetBodyRegions: BodyRegion[];
	/** Ordered list of exercises with per-slot overrides. */
	exercises: RoutineExercise[];
	estimatedDurationMin: number;
	isPreset: boolean;
	isCustom: boolean;
	isPinned: boolean;
	order: number;
}

export interface LocalStretchSession extends BaseRecord {
	routineId: string | null;
	/** Snapshot of routine name at session time (survives routine deletion). */
	routineName: string;
	startedAt: string;
	endedAt: string | null;
	totalDurationSec: number;
	completedExercises: number;
	totalExercises: number;
	skippedExerciseIds: string[];
	/** Post-session mood rating 1–5. */
	mood: number | null;
	notes: string;
}

export interface LocalStretchAssessment extends BaseRecord {
	assessedAt: string;
	tests: AssessmentTest[];
	/** Aggregate score 0–100 for trend tracking. */
	overallScore: number;
	painRegions: PainRegion[];
	notes: string;
}

export interface LocalStretchReminder extends BaseRecord {
	name: string;
	routineId: string | null;
	/** HH:mm */
	time: string;
	/** 0=Sun, 1=Mon, … 6=Sat */
	days: number[];
	isActive: boolean;
	lastTriggeredAt: string | null;
}

// ─── Domain Types (UI-facing) ───────────────────────────────

export interface StretchExercise {
	id: string;
	name: string;
	description: string;
	bodyRegion: BodyRegion;
	difficulty: Difficulty;
	defaultDurationSec: number;
	bilateral: boolean;
	tags: string[];
	isPreset: boolean;
	isArchived: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface StretchRoutine {
	id: string;
	name: string;
	description: string;
	routineType: RoutineType;
	targetBodyRegions: BodyRegion[];
	exercises: RoutineExercise[];
	estimatedDurationMin: number;
	isPreset: boolean;
	isCustom: boolean;
	isPinned: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

export interface StretchSession {
	id: string;
	routineId: string | null;
	routineName: string;
	startedAt: string;
	endedAt: string | null;
	totalDurationSec: number;
	completedExercises: number;
	totalExercises: number;
	skippedExerciseIds: string[];
	mood: number | null;
	notes: string;
	createdAt: string;
}

export interface StretchAssessment {
	id: string;
	assessedAt: string;
	tests: AssessmentTest[];
	overallScore: number;
	painRegions: PainRegion[];
	notes: string;
	createdAt: string;
}

export interface StretchReminder {
	id: string;
	name: string;
	routineId: string | null;
	time: string;
	days: number[];
	isActive: boolean;
	lastTriggeredAt: string | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Constants ──────────────────────────────────────────────

export const BODY_REGIONS: readonly BodyRegion[] = [
	'neck',
	'shoulders',
	'upper_back',
	'lower_back',
	'chest',
	'arms',
	'wrists',
	'hips',
	'quads',
	'hamstrings',
	'calves',
	'ankles',
	'full_body',
] as const;

export const BODY_REGION_LABELS: Record<BodyRegion, { de: string; en: string }> = {
	neck: { de: 'Nacken', en: 'Neck' },
	shoulders: { de: 'Schultern', en: 'Shoulders' },
	upper_back: { de: 'Oberer Rücken', en: 'Upper Back' },
	lower_back: { de: 'Unterer Rücken', en: 'Lower Back' },
	chest: { de: 'Brust', en: 'Chest' },
	arms: { de: 'Arme', en: 'Arms' },
	wrists: { de: 'Handgelenke', en: 'Wrists' },
	hips: { de: 'Hüften', en: 'Hips' },
	quads: { de: 'Oberschenkel vorne', en: 'Quads' },
	hamstrings: { de: 'Oberschenkel hinten', en: 'Hamstrings' },
	calves: { de: 'Waden', en: 'Calves' },
	ankles: { de: 'Sprunggelenke', en: 'Ankles' },
	full_body: { de: 'Ganzkörper', en: 'Full Body' },
};

export const DIFFICULTY_LABELS: Record<Difficulty, { de: string; en: string }> = {
	beginner: { de: 'Anfänger', en: 'Beginner' },
	intermediate: { de: 'Mittel', en: 'Intermediate' },
	advanced: { de: 'Fortgeschritten', en: 'Advanced' },
};

export const ROUTINE_TYPE_LABELS: Record<RoutineType, { de: string; en: string }> = {
	morning: { de: 'Morgenroutine', en: 'Morning Routine' },
	desk_break: { de: 'Schreibtisch-Pause', en: 'Desk Break' },
	post_workout: { de: 'Nach dem Training', en: 'Post Workout' },
	evening: { de: 'Abendroutine', en: 'Evening Routine' },
	focus_region: { de: 'Fokus-Bereich', en: 'Focus Region' },
	warm_up: { de: 'Aufwärmen', en: 'Warm Up' },
	custom: { de: 'Eigene Routine', en: 'Custom Routine' },
};

/** Assessment test definitions with instructions. */
export const ASSESSMENT_TESTS = [
	{
		id: 'toe-touch',
		bodyRegion: 'hamstrings' as BodyRegion,
		name: { de: 'Zehenberührung', en: 'Toe Touch' },
		instruction: {
			de: 'Stehe aufrecht, Beine gestreckt. Beuge dich langsam nach vorne. Wie weit kommst du?',
			en: 'Stand upright, legs straight. Slowly bend forward. How far can you reach?',
		},
		options: [
			{ score: 5, de: 'Hände flach auf dem Boden', en: 'Hands flat on the floor' },
			{ score: 4, de: 'Fingerspitzen berühren Boden', en: 'Fingertips touch floor' },
			{ score: 3, de: 'Fingerspitzen erreichen Zehen', en: 'Fingertips reach toes' },
			{ score: 2, de: 'Hände erreichen Schienbein', en: 'Hands reach shins' },
			{ score: 1, de: 'Hände erreichen nur Knie', en: 'Hands only reach knees' },
		],
	},
	{
		id: 'deep-squat',
		bodyRegion: 'hips' as BodyRegion,
		name: { de: 'Tiefe Hocke', en: 'Deep Squat' },
		instruction: {
			de: 'Gehe in eine tiefe Hocke. Füße schulterbreit, Fersen am Boden halten.',
			en: 'Go into a deep squat. Feet shoulder-width, keep heels on the ground.',
		},
		options: [
			{
				score: 5,
				de: 'Tiefe Hocke, Fersen am Boden, Rücken gerade',
				en: 'Deep squat, heels down, back straight',
			},
			{
				score: 4,
				de: 'Tiefe Hocke, Fersen am Boden, Rücken leicht gerundet',
				en: 'Deep squat, heels down, slight back rounding',
			},
			{ score: 3, de: 'Fersen heben leicht ab', en: 'Heels slightly lift' },
			{ score: 2, de: 'Kann nur halb runter', en: 'Can only go halfway down' },
			{ score: 1, de: 'Tiefe Hocke nicht möglich', en: 'Deep squat not possible' },
		],
	},
	{
		id: 'shoulder-reach',
		bodyRegion: 'shoulders' as BodyRegion,
		name: { de: 'Schulterreichweite', en: 'Shoulder Reach' },
		instruction: {
			de: 'Rechte Hand über die Schulter nach unten, linke Hand von unten nach oben. Berühren sich die Finger?',
			en: 'Right hand over shoulder reaching down, left hand from below reaching up. Do your fingers touch?',
		},
		options: [
			{ score: 5, de: 'Hände greifen ineinander', en: 'Hands clasp together' },
			{ score: 4, de: 'Fingerspitzen berühren sich', en: 'Fingertips touch' },
			{ score: 3, de: 'Wenige Zentimeter Abstand', en: 'Few centimeters apart' },
			{ score: 2, de: 'Deutlicher Abstand (>10cm)', en: 'Significant gap (>10cm)' },
			{ score: 1, de: 'Hände kommen nicht nah ran', en: 'Hands cannot get close' },
		],
	},
	{
		id: 'neck-rotation',
		bodyRegion: 'neck' as BodyRegion,
		name: { de: 'Nacken-Rotation', en: 'Neck Rotation' },
		instruction: {
			de: 'Drehe den Kopf langsam nach rechts, dann nach links. Kann dein Kinn die Schulter erreichen?',
			en: 'Slowly turn your head to the right, then left. Can your chin reach your shoulder?',
		},
		options: [
			{ score: 5, de: 'Kinn erreicht Schulter beidseitig', en: 'Chin reaches shoulder both sides' },
			{ score: 4, de: 'Fast an der Schulter beidseitig', en: 'Almost reaches shoulder both sides' },
			{ score: 3, de: 'Gut, aber eine Seite eingeschränkt', en: 'Good, but one side restricted' },
			{
				score: 2,
				de: 'Deutlich eingeschränkt beidseitig',
				en: 'Significantly restricted both sides',
			},
			{ score: 1, de: 'Sehr eingeschränkt oder schmerzhaft', en: 'Very restricted or painful' },
		],
	},
	{
		id: 'hip-flexor',
		bodyRegion: 'hips' as BodyRegion,
		name: { de: 'Hüftbeuger-Test', en: 'Hip Flexor Test' },
		instruction: {
			de: 'Lege dich auf den Rücken, ziehe ein Knie zur Brust. Bleibt das andere Bein flach auf dem Boden?',
			en: 'Lie on your back, pull one knee to chest. Does the other leg stay flat on the ground?',
		},
		options: [
			{ score: 5, de: 'Bein bleibt komplett flach', en: 'Leg stays completely flat' },
			{ score: 4, de: 'Bein hebt minimal ab', en: 'Leg lifts minimally' },
			{ score: 3, de: 'Bein hebt deutlich ab', en: 'Leg lifts noticeably' },
			{
				score: 2,
				de: 'Bein hebt stark ab, Zug im Hüftbeuger',
				en: 'Leg lifts significantly, pull in hip flexor',
			},
			{
				score: 1,
				de: 'Sehr eng, kann Knie kaum zur Brust ziehen',
				en: 'Very tight, can barely pull knee to chest',
			},
		],
	},
	{
		id: 'pain-check',
		bodyRegion: 'full_body' as BodyRegion,
		name: { de: 'Schmerzabfrage', en: 'Pain Check' },
		instruction: {
			de: 'Tut dir gerade irgendwo etwas weh? Markiere die Bereiche und die Intensität.',
			en: 'Are you experiencing pain anywhere right now? Mark the areas and intensity.',
		},
		options: [
			{ score: 5, de: 'Keine Schmerzen', en: 'No pain' },
			{ score: 4, de: 'Leichte Verspannung', en: 'Slight tension' },
			{ score: 3, de: 'Mäßige Beschwerden', en: 'Moderate discomfort' },
			{ score: 2, de: 'Deutliche Schmerzen', en: 'Significant pain' },
			{ score: 1, de: 'Starke Schmerzen', en: 'Severe pain' },
		],
	},
] as const;
