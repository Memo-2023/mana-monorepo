import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import {
	Plant,
	PlantWateringStatus,
	PlantaModuleOptions,
	PLANTA_MODULE_OPTIONS,
	DEFAULT_PLANTA_API_URL,
} from './types';

/**
 * Planta API Service
 *
 * Connects to the planta-backend API for plant care management.
 * Used by the morning summary to show plants that need watering.
 *
 * @example
 * ```typescript
 * // Get plants needing water (requires JWT token)
 * const plants = await plantaApiService.getPlantsNeedingWater(token);
 *
 * // Log watering
 * await plantaApiService.logWatering(token, plantId);
 * ```
 */
@Injectable()
export class PlantaApiService {
	private readonly logger = new Logger(PlantaApiService.name);
	private readonly baseUrl: string;

	constructor(@Optional() @Inject(PLANTA_MODULE_OPTIONS) options?: PlantaModuleOptions) {
		this.baseUrl = options?.apiUrl || DEFAULT_PLANTA_API_URL;
		this.logger.log(`Planta API Service initialized with URL: ${this.baseUrl}`);
	}

	/**
	 * Get plants that need watering (overdue or due today)
	 */
	async getPlantsNeedingWater(token: string): Promise<PlantWateringStatus[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/watering/upcoming`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as PlantWateringStatus[];

			// Filter to only overdue and today
			return data.filter((p) => p.isOverdue || p.daysUntilWatering === 0);
		} catch (error) {
			this.logger.error('Failed to get plants needing water:', error);
			return [];
		}
	}

	/**
	 * Get all upcoming watering (next 3 days)
	 */
	async getUpcomingWatering(token: string): Promise<PlantWateringStatus[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/watering/upcoming`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			return (await response.json()) as PlantWateringStatus[];
		} catch (error) {
			this.logger.error('Failed to get upcoming watering:', error);
			return [];
		}
	}

	/**
	 * Get all plants
	 */
	async getPlants(token: string): Promise<Plant[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/v1/plants`, {
				headers: { Authorization: `Bearer ${token}` },
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			const data = (await response.json()) as { plants?: Plant[] };
			return data.plants || [];
		} catch (error) {
			this.logger.error('Failed to get plants:', error);
			return [];
		}
	}

	/**
	 * Log watering for a plant
	 */
	async logWatering(token: string, plantId: string, notes?: string): Promise<boolean> {
		try {
			const body: Record<string, unknown> = {};
			if (notes) body.notes = notes;

			const response = await fetch(`${this.baseUrl}/api/v1/watering/${plantId}/water`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`API error: ${response.status}`);
			}

			this.logger.log(`Logged watering for plant ${plantId}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to log watering for plant ${plantId}:`, error);
			return false;
		}
	}

	/**
	 * Format plants needing water for display
	 */
	formatPlantsNeedingWater(plants: PlantWateringStatus[]): string {
		if (plants.length === 0) {
			return '';
		}

		const overdue = plants.filter((p) => p.isOverdue);
		const today = plants.filter((p) => !p.isOverdue && p.daysUntilWatering === 0);

		const lines: string[] = ['**Pflanzen giessen** 🌱'];

		if (overdue.length > 0) {
			for (const plant of overdue) {
				lines.push(`• ${plant.plantName} (ueberfaellig!)`);
			}
		}

		if (today.length > 0) {
			for (const plant of today) {
				lines.push(`• ${plant.plantName}`);
			}
		}

		return lines.join('\n');
	}
}
