/**
 * Planta API Service Types
 *
 * Types for plant care and watering management
 */

/**
 * Plant with watering info
 */
export interface Plant {
	id: string;
	name: string;
	scientificName?: string;
	healthStatus?: 'healthy' | 'needs_attention' | 'sick';
	photoUrl?: string;
}

/**
 * Plant watering status
 */
export interface PlantWateringStatus {
	plantId: string;
	plantName: string;
	daysUntilWatering: number;
	isOverdue: boolean;
	lastWateredAt: Date | null;
	nextWateringAt: Date | null;
	photoUrl?: string;
}

/**
 * Planta API module options
 */
export interface PlantaModuleOptions {
	apiUrl?: string;
}

/**
 * Injection token for Planta module options
 */
export const PLANTA_MODULE_OPTIONS = 'PLANTA_MODULE_OPTIONS';

/**
 * Default API URL
 */
export const DEFAULT_PLANTA_API_URL = 'http://localhost:3022';
