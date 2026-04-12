/**
 * Plants module — collection accessors and guest seed data.
 *
 * Tables are already defined in the unified database (database.ts):
 *   plants, plantPhotos, wateringSchedules, wateringLogs
 */

import { db } from '$lib/data/database';
import type { LocalPlant, LocalPlantPhoto, LocalWateringSchedule, LocalWateringLog } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const plantTable = db.table<LocalPlant>('plants');
export const plantPhotoTable = db.table<LocalPlantPhoto>('plantPhotos');
export const wateringScheduleTable = db.table<LocalWateringSchedule>('wateringSchedules');
export const wateringLogTable = db.table<LocalWateringLog>('wateringLogs');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_PLANT_ID = 'demo-monstera';

export const PLANTS_GUEST_SEED = {
	plants: [
		{
			id: DEMO_PLANT_ID,
			name: 'Monstera',
			scientificName: 'Monstera deliciosa',
			commonName: 'Fensterblatt',
			species: null,
			lightRequirements: 'bright' as const,
			wateringFrequencyDays: 7,
			humidity: 'medium' as const,
			temperature: '18-24\u00b0C',
			soilType: null,
			careNotes: 'Mag indirektes Licht. Erde zwischen dem Giessen leicht antrocknen lassen.',
			isActive: true,
			healthStatus: 'healthy' as const,
			acquiredAt: null,
		},
		{
			id: 'demo-cactus',
			name: 'Kaktus',
			scientificName: 'Echinocactus grusonii',
			commonName: 'Schwiegermutterstuhl',
			species: null,
			lightRequirements: 'direct' as const,
			wateringFrequencyDays: 21,
			humidity: 'low' as const,
			temperature: '15-30\u00b0C',
			soilType: null,
			careNotes: 'Selten giessen, mag viel Sonne.',
			isActive: true,
			healthStatus: 'healthy' as const,
			acquiredAt: null,
		},
	],
	wateringSchedules: [
		{
			id: 'schedule-monstera',
			plantId: DEMO_PLANT_ID,
			frequencyDays: 7,
			lastWateredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
			nextWateringAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
			reminderEnabled: true,
			reminderHoursBefore: 24,
		},
		{
			id: 'schedule-cactus',
			plantId: 'demo-cactus',
			frequencyDays: 21,
			lastWateredAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
			nextWateringAt: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
			reminderEnabled: true,
			reminderHoursBefore: 24,
		},
	],
};
