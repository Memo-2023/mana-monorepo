/**
 * Stretch module — collection accessors and guest seed data.
 *
 * Tables are defined in the unified database.ts as:
 * stretchExercises, stretchRoutines, stretchSessions,
 * stretchAssessments, stretchReminders.
 */

import { db } from '$lib/data/database';
import type {
	LocalStretchExercise,
	LocalStretchRoutine,
	LocalStretchSession,
	LocalStretchAssessment,
	LocalStretchReminder,
} from './types';

// ─── Collection Accessors ───────────────────────────────────

export const stretchExerciseTable = db.table<LocalStretchExercise>('stretchExercises');
export const stretchRoutineTable = db.table<LocalStretchRoutine>('stretchRoutines');
export const stretchSessionTable = db.table<LocalStretchSession>('stretchSessions');
export const stretchAssessmentTable = db.table<LocalStretchAssessment>('stretchAssessments');
export const stretchReminderTable = db.table<LocalStretchReminder>('stretchReminders');

// ─── Guest Seed ─────────────────────────────────────────────

/**
 * Preset exercise library so a fresh guest can immediately start a routine.
 * isPreset:true prevents deletion; users can add their own exercises freely.
 */
export const STRETCH_GUEST_SEED = {
	stretchExercises: [
		// ─── Neck ─────────────────────────────────────────
		{
			id: 'stretch-ex-neck-lateral',
			name: 'Nacken seitlich neigen',
			description:
				'Kopf sanft zur Seite neigen, gegenüberliegende Schulter nach unten drücken. Dehnung an der Halsseite spüren.',
			bodyRegion: 'neck',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['nacken', 'büro'],
			isPreset: true,
			isArchived: false,
			order: 0,
		},
		{
			id: 'stretch-ex-neck-rotation',
			name: 'Nacken-Rotation',
			description:
				'Kopf langsam nach rechts drehen, kurz halten, dann nach links. Sanft bis zur Dehnungsgrenze.',
			bodyRegion: 'neck',
			difficulty: 'beginner',
			defaultDurationSec: 20,
			bilateral: true,
			tags: ['nacken', 'büro'],
			isPreset: true,
			isArchived: false,
			order: 1,
		},
		// ─── Shoulders ────────────────────────────────────
		{
			id: 'stretch-ex-shoulder-cross',
			name: 'Schulter-Dehnung quer',
			description:
				'Arm vor der Brust quer halten, mit der anderen Hand sanft heranziehen. Dehnung in der hinteren Schulter spüren.',
			bodyRegion: 'shoulders',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['schulter', 'büro'],
			isPreset: true,
			isArchived: false,
			order: 2,
		},
		{
			id: 'stretch-ex-triceps-overhead',
			name: 'Trizeps-Dehnung über Kopf',
			description:
				'Arm über den Kopf heben, Ellbogen beugen, Hand zum gegenüberliegenden Schulterblatt. Mit der anderen Hand sanft am Ellbogen drücken.',
			bodyRegion: 'arms',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['arme', 'schulter'],
			isPreset: true,
			isArchived: false,
			order: 3,
		},
		// ─── Chest ────────────────────────────────────────
		{
			id: 'stretch-ex-chest-doorway',
			name: 'Brustöffner am Türrahmen',
			description:
				'Unterarm am Türrahmen, Ellbogen auf Schulterhöhe. Oberkörper sanft nach vorne lehnen, bis Dehnung in der Brust spürbar.',
			bodyRegion: 'chest',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['brust', 'büro'],
			isPreset: true,
			isArchived: false,
			order: 4,
		},
		// ─── Upper Back ───────────────────────────────────
		{
			id: 'stretch-ex-cat-cow',
			name: 'Katze-Kuh (Cat-Cow)',
			description:
				'Vierfüßlerstand. Einatmen: Rücken durchhängen, Blick nach oben. Ausatmen: Rücken runden, Kinn zur Brust.',
			bodyRegion: 'upper_back',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: false,
			tags: ['rücken', 'mobilität'],
			isPreset: true,
			isArchived: false,
			order: 5,
		},
		{
			id: 'stretch-ex-thread-needle',
			name: 'Faden durch das Nadelöhr',
			description:
				'Vierfüßlerstand. Einen Arm unter dem Körper durchfädeln, Schulter ablegen. Rotation in der Brustwirbelsäule.',
			bodyRegion: 'upper_back',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['rücken', 'rotation'],
			isPreset: true,
			isArchived: false,
			order: 6,
		},
		// ─── Lower Back ───────────────────────────────────
		{
			id: 'stretch-ex-child-pose',
			name: "Kindshaltung (Child's Pose)",
			description:
				'Knie am Boden, Gesäß auf die Fersen setzen, Arme nach vorne strecken, Stirn ablegen. Rücken sanft dehnen.',
			bodyRegion: 'lower_back',
			difficulty: 'beginner',
			defaultDurationSec: 45,
			bilateral: false,
			tags: ['rücken', 'entspannung'],
			isPreset: true,
			isArchived: false,
			order: 7,
		},
		{
			id: 'stretch-ex-cobra',
			name: 'Kobra (Cobra)',
			description:
				'Bauchlage, Hände neben den Schultern. Oberkörper langsam hochdrücken, Hüfte bleibt am Boden. Dehnung in Bauch und unterem Rücken.',
			bodyRegion: 'lower_back',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: false,
			tags: ['rücken', 'bauch'],
			isPreset: true,
			isArchived: false,
			order: 8,
		},
		{
			id: 'stretch-ex-spinal-twist',
			name: 'Liegende Wirbelsäulendrehung',
			description:
				'Rückenlage, ein Knie zur Seite fallen lassen, Schultern am Boden. Sanfte Rotation der Wirbelsäule.',
			bodyRegion: 'lower_back',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['rücken', 'rotation'],
			isPreset: true,
			isArchived: false,
			order: 9,
		},
		// ─── Hips ─────────────────────────────────────────
		{
			id: 'stretch-ex-hip-flexor-lunge',
			name: 'Hüftbeuger-Stretch (Ausfallschritt)',
			description:
				'Tiefer Ausfallschritt, hinteres Knie am Boden. Hüfte nach vorne schieben. Dehnung im vorderen Hüftbeuger des hinteren Beins.',
			bodyRegion: 'hips',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['hüfte', 'beine'],
			isPreset: true,
			isArchived: false,
			order: 10,
		},
		{
			id: 'stretch-ex-pigeon',
			name: 'Tauben-Haltung (Pigeon Pose)',
			description:
				'Ein Bein angewinkelt vor dem Körper, das andere gestreckt nach hinten. Oberkörper über das vordere Bein senken.',
			bodyRegion: 'hips',
			difficulty: 'intermediate',
			defaultDurationSec: 45,
			bilateral: true,
			tags: ['hüfte', 'yoga'],
			isPreset: true,
			isArchived: false,
			order: 11,
		},
		{
			id: 'stretch-ex-butterfly',
			name: 'Schmetterling (Butterfly)',
			description:
				'Sitzen, Fußsohlen zusammen, Knie nach außen fallen lassen. Sanft die Knie Richtung Boden drücken.',
			bodyRegion: 'hips',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: false,
			tags: ['hüfte', 'leiste'],
			isPreset: true,
			isArchived: false,
			order: 12,
		},
		{
			id: 'stretch-ex-90-90',
			name: '90/90 Hüft-Stretch',
			description:
				'Sitzen, beide Beine im 90°-Winkel gebeugt. Vorderes Bein außenrotiert, hinteres innenrotiert. Oberkörper aufrecht.',
			bodyRegion: 'hips',
			difficulty: 'intermediate',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['hüfte', 'mobilität'],
			isPreset: true,
			isArchived: false,
			order: 13,
		},
		// ─── Hamstrings ───────────────────────────────────
		{
			id: 'stretch-ex-standing-forward-fold',
			name: 'Stehende Vorbeuge',
			description:
				'Stehend, Beine gestreckt, Oberkörper langsam nach vorne hängen lassen. Schwerkraft arbeiten lassen.',
			bodyRegion: 'hamstrings',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: false,
			tags: ['beine', 'rücken'],
			isPreset: true,
			isArchived: false,
			order: 14,
		},
		{
			id: 'stretch-ex-seated-forward-fold',
			name: 'Sitzende Vorbeuge',
			description:
				'Sitzen, Beine gestreckt. Oberkörper langsam nach vorne beugen, Hände Richtung Zehen.',
			bodyRegion: 'hamstrings',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: false,
			tags: ['beine'],
			isPreset: true,
			isArchived: false,
			order: 15,
		},
		// ─── Quads ────────────────────────────────────────
		{
			id: 'stretch-ex-quad-standing',
			name: 'Quadrizeps-Dehnung stehend',
			description:
				'Stehend, Fuß zum Gesäß ziehen, Knie zusammen. Dehnung an der Oberschenkel-Vorderseite.',
			bodyRegion: 'quads',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['beine'],
			isPreset: true,
			isArchived: false,
			order: 16,
		},
		// ─── Calves ───────────────────────────────────────
		{
			id: 'stretch-ex-calf-wall',
			name: 'Wadenstretch an der Wand',
			description:
				'Hände an der Wand, ein Bein nach hinten gestreckt, Ferse am Boden. Vorderes Knie beugen.',
			bodyRegion: 'calves',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['beine', 'waden'],
			isPreset: true,
			isArchived: false,
			order: 17,
		},
		// ─── Wrists ───────────────────────────────────────
		{
			id: 'stretch-ex-wrist-circles',
			name: 'Handgelenk-Kreise',
			description: 'Hände zu Fäusten ballen, langsame Kreise in beide Richtungen. 10× je Richtung.',
			bodyRegion: 'wrists',
			difficulty: 'beginner',
			defaultDurationSec: 20,
			bilateral: false,
			tags: ['handgelenke', 'büro'],
			isPreset: true,
			isArchived: false,
			order: 18,
		},
		{
			id: 'stretch-ex-wrist-flexor',
			name: 'Handgelenk-Beuger Dehnung',
			description:
				'Arm nach vorne strecken, Handfläche nach oben, mit der anderen Hand die Finger sanft nach unten ziehen.',
			bodyRegion: 'wrists',
			difficulty: 'beginner',
			defaultDurationSec: 20,
			bilateral: true,
			tags: ['handgelenke', 'büro'],
			isPreset: true,
			isArchived: false,
			order: 19,
		},
		// ─── Full Body ────────────────────────────────────
		{
			id: 'stretch-ex-downward-dog',
			name: 'Herabschauender Hund',
			description:
				'Hände und Füße am Boden, Hüfte nach oben drücken. Umgekehrtes V. Fersen Richtung Boden drücken.',
			bodyRegion: 'full_body',
			difficulty: 'beginner',
			defaultDurationSec: 30,
			bilateral: false,
			tags: ['ganzkörper', 'yoga'],
			isPreset: true,
			isArchived: false,
			order: 20,
		},
		{
			id: 'stretch-ex-worlds-greatest',
			name: "World's Greatest Stretch",
			description:
				'Ausfallschritt, Hand neben dem vorderen Fuß, andere Hand zur Decke rotieren. Kombiniert Hüft-, Brust- und Wirbelsäulenrotation.',
			bodyRegion: 'full_body',
			difficulty: 'intermediate',
			defaultDurationSec: 30,
			bilateral: true,
			tags: ['ganzkörper', 'mobilität'],
			isPreset: true,
			isArchived: false,
			order: 21,
		},
	] satisfies LocalStretchExercise[],

	stretchRoutines: [
		{
			id: 'stretch-routine-morning',
			name: 'Guten Morgen',
			description:
				'Sanftes Aufwachen — Durchblutung anregen und den Körper für den Tag vorbereiten.',
			routineType: 'morning',
			targetBodyRegions: ['neck', 'shoulders', 'upper_back', 'lower_back', 'hips', 'hamstrings'],
			exercises: [
				{ exerciseId: 'stretch-ex-cat-cow', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-child-pose', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-spinal-twist', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-downward-dog', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-hip-flexor-lunge', durationSec: 30, restAfterSec: 5, notes: '' },
				{
					exerciseId: 'stretch-ex-standing-forward-fold',
					durationSec: 30,
					restAfterSec: 0,
					notes: '',
				},
			],
			estimatedDurationMin: 5,
			isPreset: true,
			isCustom: false,
			isPinned: true,
			order: 0,
		},
		{
			id: 'stretch-routine-desk',
			name: 'Schreibtisch-Pause',
			description:
				'Kurze Pause vom Bildschirm — Nacken, Schultern, Handgelenke und Hüftbeuger lösen.',
			routineType: 'desk_break',
			targetBodyRegions: ['neck', 'shoulders', 'wrists', 'hips', 'chest'],
			exercises: [
				{ exerciseId: 'stretch-ex-neck-lateral', durationSec: 20, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-neck-rotation', durationSec: 20, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-shoulder-cross', durationSec: 25, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-wrist-circles', durationSec: 20, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-chest-doorway', durationSec: 25, restAfterSec: 0, notes: '' },
			],
			estimatedDurationMin: 3,
			isPreset: true,
			isCustom: false,
			isPinned: true,
			order: 1,
		},
		{
			id: 'stretch-routine-evening',
			name: 'Feierabend-Flow',
			description:
				'Entspannung und Entlastung nach einem langen Tag — Fokus auf unteren Rücken und Hüften.',
			routineType: 'evening',
			targetBodyRegions: ['lower_back', 'hips', 'hamstrings', 'shoulders', 'neck'],
			exercises: [
				{ exerciseId: 'stretch-ex-neck-lateral', durationSec: 25, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-shoulder-cross', durationSec: 25, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-cat-cow', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-child-pose', durationSec: 45, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-spinal-twist', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-butterfly', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-pigeon', durationSec: 40, restAfterSec: 5, notes: '' },
				{
					exerciseId: 'stretch-ex-seated-forward-fold',
					durationSec: 30,
					restAfterSec: 0,
					notes: '',
				},
			],
			estimatedDurationMin: 8,
			isPreset: true,
			isCustom: false,
			isPinned: true,
			order: 2,
		},
		{
			id: 'stretch-routine-upper',
			name: 'Oberkörper-Löser',
			description:
				'Nacken, Schultern, Brust und oberer Rücken — ideal bei Verspannungen vom Sitzen.',
			routineType: 'focus_region',
			targetBodyRegions: ['neck', 'shoulders', 'chest', 'upper_back', 'arms'],
			exercises: [
				{ exerciseId: 'stretch-ex-neck-lateral', durationSec: 25, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-neck-rotation', durationSec: 20, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-shoulder-cross', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-triceps-overhead', durationSec: 25, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-chest-doorway', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-thread-needle', durationSec: 30, restAfterSec: 0, notes: '' },
			],
			estimatedDurationMin: 5,
			isPreset: true,
			isCustom: false,
			isPinned: false,
			order: 3,
		},
		{
			id: 'stretch-routine-lower',
			name: 'Unterkörper-Öffner',
			description:
				'Hüften, Beinrückseite, Oberschenkel und Waden — für mehr Beweglichkeit in den Beinen.',
			routineType: 'focus_region',
			targetBodyRegions: ['hips', 'hamstrings', 'quads', 'calves'],
			exercises: [
				{ exerciseId: 'stretch-ex-hip-flexor-lunge', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-butterfly', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-pigeon', durationSec: 40, restAfterSec: 5, notes: '' },
				{
					exerciseId: 'stretch-ex-standing-forward-fold',
					durationSec: 30,
					restAfterSec: 5,
					notes: '',
				},
				{ exerciseId: 'stretch-ex-quad-standing', durationSec: 30, restAfterSec: 5, notes: '' },
				{ exerciseId: 'stretch-ex-calf-wall', durationSec: 30, restAfterSec: 0, notes: '' },
			],
			estimatedDurationMin: 6,
			isPreset: true,
			isCustom: false,
			isPinned: false,
			order: 4,
		},
	] satisfies LocalStretchRoutine[],

	stretchSessions: [] satisfies LocalStretchSession[],
	stretchAssessments: [] satisfies LocalStretchAssessment[],
	stretchReminders: [] satisfies LocalStretchReminder[],
};
