/**
 * Planta module types for the unified app.
 */

import type { BaseRecord } from '@mana/local-store';

// ─── Enums ─────────────────────────────────────────────────

export type LightLevel = 'low' | 'medium' | 'bright' | 'direct';
export type HumidityLevel = 'low' | 'medium' | 'high';
export type HealthStatus = 'healthy' | 'needs_attention' | 'sick';
export type HealthAssessment = 'healthy' | 'minor_issues' | 'needs_care' | 'critical';

// ─── Local Record Types ────────────────────────────────────

export interface LocalPlant extends BaseRecord {
	name: string;
	scientificName?: string | null;
	commonName?: string | null;
	species?: string | null;
	lightRequirements?: LightLevel | null;
	wateringFrequencyDays?: number | null;
	humidity?: HumidityLevel | null;
	temperature?: string | null;
	soilType?: string | null;
	careNotes?: string | null;
	isActive: boolean;
	healthStatus?: HealthStatus | null;
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

// ─── Shared Domain Types ───────────────────────────────────

export interface Plant {
	id: string;
	name: string;
	scientificName?: string;
	commonName?: string;
	species?: string;
	lightRequirements?: LightLevel;
	wateringFrequencyDays?: number;
	humidity?: HumidityLevel;
	temperature?: string;
	soilType?: string;
	careNotes?: string;
	isActive: boolean;
	healthStatus?: HealthStatus;
	acquiredAt?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface PlantPhoto {
	id: string;
	plantId: string;
	storagePath: string;
	publicUrl?: string;
	filename: string;
	mimeType?: string;
	fileSize?: number;
	width?: number;
	height?: number;
	isPrimary: boolean;
	isAnalyzed: boolean;
	takenAt?: Date;
	createdAt: Date;
}

export interface WateringSchedule {
	id: string;
	plantId: string;
	frequencyDays: number;
	lastWateredAt?: Date;
	nextWateringAt?: Date;
	reminderEnabled: boolean;
	reminderHoursBefore: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface WateringLog {
	id: string;
	plantId: string;
	wateredAt: Date;
	notes?: string;
	createdAt: Date;
}

// ─── DTOs ──────────────────────────────────────────────────

export interface CreatePlantDto {
	name: string;
	scientificName?: string;
	commonName?: string;
	acquiredAt?: string;
}

export interface UpdatePlantDto {
	name?: string;
	scientificName?: string;
	commonName?: string;
	careNotes?: string;
	isActive?: boolean;
	lightRequirements?: LightLevel;
	wateringFrequencyDays?: number;
	humidity?: HumidityLevel;
}
