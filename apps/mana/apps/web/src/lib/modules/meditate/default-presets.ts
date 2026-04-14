/**
 * Meditate module — seed presets for new users.
 *
 * Five presets covering the three categories: silence, breathing, bodyscan.
 */

import type { LocalMeditatePreset } from './types';

export const DEFAULT_PRESETS: LocalMeditatePreset[] = [
	{
		id: 'meditate-preset-silence',
		name: 'Stille Meditation',
		description:
			'Setze dich hin, schließe die Augen und beobachte deinen Atem ohne ihn zu steuern.',
		category: 'silence',
		breathPattern: null,
		bodyScanSteps: null,
		defaultDurationSec: 600,
		isPreset: true,
		isArchived: false,
		order: 0,
	},
	{
		id: 'meditate-preset-box',
		name: 'Box Breathing',
		description:
			'Gleichmäßiges Atmen im 4-4-4-4-Rhythmus. Beruhigt das Nervensystem und schärft den Fokus.',
		category: 'breathing',
		breathPattern: { inhale: 4, hold1: 4, exhale: 4, hold2: 4 },
		bodyScanSteps: null,
		defaultDurationSec: 300,
		isPreset: true,
		isArchived: false,
		order: 1,
	},
	{
		id: 'meditate-preset-478',
		name: '4-7-8 Entspannung',
		description:
			'Tiefe Entspannung: 4s einatmen, 7s halten, 8s langsam ausatmen. Ideal zum Einschlafen.',
		category: 'breathing',
		breathPattern: { inhale: 4, hold1: 7, exhale: 8, hold2: 0 },
		bodyScanSteps: null,
		defaultDurationSec: 300,
		isPreset: true,
		isArchived: false,
		order: 2,
	},
	{
		id: 'meditate-preset-wimhof',
		name: 'Wim Hof',
		description:
			'Kraftvolles Ein- und Ausatmen in schnellem Rhythmus. Energetisierend und aktivierend.',
		category: 'breathing',
		breathPattern: { inhale: 2, hold1: 0, exhale: 2, hold2: 0 },
		bodyScanSteps: null,
		defaultDurationSec: 300,
		isPreset: true,
		isArchived: false,
		order: 3,
	},
	{
		id: 'meditate-preset-bodyscan',
		name: 'Body Scan',
		description: 'Wandere mit deiner Aufmerksamkeit durch den Körper, von den Füßen bis zum Kopf.',
		category: 'bodyscan',
		breathPattern: null,
		bodyScanSteps: [
			'Füße — Spüre den Kontakt zum Boden. Lass die Spannung los.',
			'Unterschenkel & Knie — Lass die Muskeln weich werden.',
			'Oberschenkel & Hüfte — Spüre die Schwere. Lass los.',
			'Bauch & unterer Rücken — Atme in den Bauch. Lass ihn weich werden.',
			'Brust & oberer Rücken — Spüre den Atem. Lass die Schultern sinken.',
			'Hände & Arme — Lass die Finger entspannen. Spüre die Wärme.',
			'Nacken & Schultern — Löse alle Anspannung. Lass den Kopf schwer werden.',
			'Gesicht & Kopf — Stirn entspannen, Kiefer lockern, Augen ruhen lassen.',
		],
		defaultDurationSec: 600,
		isPreset: true,
		isArchived: false,
		order: 4,
	},
];
