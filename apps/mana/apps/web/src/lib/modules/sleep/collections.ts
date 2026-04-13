/**
 * Sleep module — collection accessors and guest seed data.
 */

import { db } from '$lib/data/database';
import type {
	LocalSleepEntry,
	LocalSleepHygieneLog,
	LocalSleepHygieneCheck,
	LocalSleepSettings,
} from './types';

// ─── Collection Accessors ───────────────────────────────────

export const sleepEntryTable = db.table<LocalSleepEntry>('sleepEntries');
export const sleepHygieneLogTable = db.table<LocalSleepHygieneLog>('sleepHygieneLogs');
export const sleepHygieneCheckTable = db.table<LocalSleepHygieneCheck>('sleepHygieneChecks');
export const sleepSettingsTable = db.table<LocalSleepSettings>('sleepSettings');

// ─── Guest Seed ─────────────────────────────────────────────

export const SLEEP_GUEST_SEED = {
	sleepHygieneChecks: [
		{
			id: 'hygiene-no-caffeine',
			name: 'Kein Koffein nach 14:00',
			description:
				'Koffein hat eine Halbwertszeit von ~6 Stunden und kann den Schlaf auch spät abends noch stören.',
			category: 'nutrition',
			isActive: true,
			isPreset: true,
			order: 0,
		},
		{
			id: 'hygiene-no-alcohol',
			name: 'Kein Alkohol 3h vor Schlaf',
			description:
				'Alkohol verkürzt die REM-Phase und verschlechtert die Schlafqualität trotz schnellerem Einschlafen.',
			category: 'nutrition',
			isActive: true,
			isPreset: true,
			order: 1,
		},
		{
			id: 'hygiene-no-heavy-meal',
			name: 'Keine schwere Mahlzeit 2h vor Schlaf',
			description:
				'Schwere Mahlzeiten belasten die Verdauung und können zu unruhigem Schlaf führen.',
			category: 'nutrition',
			isActive: true,
			isPreset: true,
			order: 2,
		},
		{
			id: 'hygiene-screens-off',
			name: 'Bildschirme aus 1h vor Schlaf',
			description:
				'Blaues Licht unterdrückt die Melatonin-Produktion und verzögert das Einschlafen.',
			category: 'digital',
			isActive: true,
			isPreset: true,
			order: 3,
		},
		{
			id: 'hygiene-no-phone-bed',
			name: 'Kein Handy im Bett',
			description:
				'Das Bett sollte nur mit Schlafen assoziiert werden — Doom-Scrolling ist der Feind.',
			category: 'digital',
			isActive: true,
			isPreset: true,
			order: 4,
		},
		{
			id: 'hygiene-cool-room',
			name: 'Schlafzimmer kühl (16–18°C)',
			description:
				'Die ideale Schlaftemperatur liegt bei 16–18°C. Zu warm stört das Durchschlafen.',
			category: 'environment',
			isActive: true,
			isPreset: true,
			order: 5,
		},
		{
			id: 'hygiene-dark-room',
			name: 'Schlafzimmer dunkel',
			description:
				'Dunkelheit fördert die Melatonin-Produktion. Verdunkelungsvorhänge oder Schlafmaske nutzen.',
			category: 'environment',
			isActive: true,
			isPreset: true,
			order: 6,
		},
		{
			id: 'hygiene-quiet',
			name: 'Ruhige Umgebung',
			description: 'Lärm stört den Tiefschlaf. Ohrstöpsel oder White Noise nutzen wenn nötig.',
			category: 'environment',
			isActive: true,
			isPreset: true,
			order: 7,
		},
		{
			id: 'hygiene-wind-down',
			name: 'Entspannungsroutine gemacht',
			description:
				'Dehnen, Lesen, Meditation oder Atemübungen — ein Signal an den Körper dass es Zeit ist.',
			category: 'routine',
			isActive: true,
			isPreset: true,
			order: 8,
		},
		{
			id: 'hygiene-consistent-time',
			name: 'Gleiche Schlafenszeit ±30min',
			description: 'Regelmäßige Schlafenszeiten stabilisieren den zirkadianen Rhythmus.',
			category: 'consistency',
			isActive: true,
			isPreset: true,
			order: 9,
		},
	] satisfies LocalSleepHygieneCheck[],

	sleepEntries: [] satisfies LocalSleepEntry[],
	sleepHygieneLogs: [] satisfies LocalSleepHygieneLog[],
	sleepSettings: [] satisfies LocalSleepSettings[],
};
