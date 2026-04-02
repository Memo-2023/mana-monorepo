/**
 * Planta — Local-First Data Layer
 *
 * Plants, watering schedules, and watering logs stored locally.
 * Photo upload and AI analysis remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestPlants, guestWateringSchedules } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalPlant extends BaseRecord {
	name: string;
	scientificName?: string | null;
	commonName?: string | null;
	species?: string | null;
	lightRequirements?: 'low' | 'medium' | 'bright' | 'direct' | null;
	wateringFrequencyDays?: number | null;
	humidity?: 'low' | 'medium' | 'high' | null;
	temperature?: string | null;
	soilType?: string | null;
	careNotes?: string | null;
	isActive: boolean;
	healthStatus?: 'healthy' | 'needs_attention' | 'sick' | null;
	acquiredAt?: string | null;
}

export interface LocalPlantPhoto extends BaseRecord {
	plantId: string;
	storagePath: string;
	publicUrl?: string | null;
	filename: string;
	mimeType?: string | null;
	fileSize?: number | null;
	width?: number | null;
	height?: number | null;
	isPrimary: boolean;
	isAnalyzed: boolean;
	takenAt?: string | null;
}

export interface LocalWateringSchedule extends BaseRecord {
	plantId: string;
	frequencyDays: number;
	lastWateredAt?: string | null;
	nextWateringAt?: string | null;
	reminderEnabled: boolean;
	reminderHoursBefore: number;
}

export interface LocalWateringLog extends BaseRecord {
	plantId: string;
	wateredAt: string;
	notes?: string | null;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const plantaStore = createLocalStore({
	appId: 'planta',
	collections: [
		{
			name: 'plants',
			indexes: ['isActive', 'healthStatus'],
			guestSeed: guestPlants,
		},
		{
			name: 'plantPhotos',
			indexes: ['plantId', 'isPrimary', '[plantId+isPrimary]'],
		},
		{
			name: 'wateringSchedules',
			indexes: ['plantId', 'nextWateringAt'],
			guestSeed: guestWateringSchedules,
		},
		{
			name: 'wateringLogs',
			indexes: ['plantId', 'wateredAt'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const plantCollection = plantaStore.collection<LocalPlant>('plants');
export const plantPhotoCollection = plantaStore.collection<LocalPlantPhoto>('plantPhotos');
export const wateringScheduleCollection =
	plantaStore.collection<LocalWateringSchedule>('wateringSchedules');
export const wateringLogCollection = plantaStore.collection<LocalWateringLog>('wateringLogs');
