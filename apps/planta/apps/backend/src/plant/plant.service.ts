import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import type { Database } from '../db/connection';
import { plants, plantPhotos, wateringSchedules, plantAnalyses } from '../db/schema';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Injectable()
export class PlantService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string) {
		const userPlants = await this.db
			.select()
			.from(plants)
			.where(and(eq(plants.userId, userId), eq(plants.isActive, true)))
			.orderBy(desc(plants.createdAt));

		// Get primary photos for each plant
		const plantsWithPhotos = await Promise.all(
			userPlants.map(async (plant) => {
				const photos = await this.db
					.select()
					.from(plantPhotos)
					.where(and(eq(plantPhotos.plantId, plant.id), eq(plantPhotos.isPrimary, true)))
					.limit(1);

				const schedule = await this.db
					.select()
					.from(wateringSchedules)
					.where(eq(wateringSchedules.plantId, plant.id))
					.limit(1);

				return {
					...plant,
					primaryPhoto: photos[0] || null,
					wateringSchedule: schedule[0] || null,
				};
			})
		);

		return plantsWithPhotos;
	}

	async findOne(id: string, userId: string) {
		const [plant] = await this.db
			.select()
			.from(plants)
			.where(and(eq(plants.id, id), eq(plants.userId, userId)))
			.limit(1);

		if (!plant) {
			throw new NotFoundException('Plant not found');
		}

		// Get all photos
		const photos = await this.db
			.select()
			.from(plantPhotos)
			.where(eq(plantPhotos.plantId, id))
			.orderBy(desc(plantPhotos.isPrimary), desc(plantPhotos.createdAt));

		// Get watering schedule
		const [schedule] = await this.db
			.select()
			.from(wateringSchedules)
			.where(eq(wateringSchedules.plantId, id))
			.limit(1);

		// Get latest analysis
		const [latestAnalysis] = await this.db
			.select()
			.from(plantAnalyses)
			.where(eq(plantAnalyses.plantId, id))
			.orderBy(desc(plantAnalyses.createdAt))
			.limit(1);

		return {
			...plant,
			photos,
			wateringSchedule: schedule || null,
			latestAnalysis: latestAnalysis || null,
		};
	}

	async create(userId: string, dto: CreatePlantDto) {
		const [plant] = await this.db
			.insert(plants)
			.values({
				userId,
				name: dto.name,
				scientificName: dto.scientificName,
				commonName: dto.commonName,
				acquiredAt: dto.acquiredAt ? new Date(dto.acquiredAt) : null,
			})
			.returning();

		return plant;
	}

	async update(id: string, userId: string, dto: UpdatePlantDto) {
		const [existing] = await this.db
			.select()
			.from(plants)
			.where(and(eq(plants.id, id), eq(plants.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException('Plant not found');
		}

		const [updated] = await this.db
			.update(plants)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(eq(plants.id, id))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string) {
		const [existing] = await this.db
			.select()
			.from(plants)
			.where(and(eq(plants.id, id), eq(plants.userId, userId)))
			.limit(1);

		if (!existing) {
			throw new NotFoundException('Plant not found');
		}

		await this.db.delete(plants).where(eq(plants.id, id));

		return { success: true };
	}

	async updateFromAnalysis(
		plantId: string,
		analysis: {
			scientificName?: string;
			commonName?: string;
			lightRequirements?: string;
			wateringFrequencyDays?: number;
			humidity?: string;
			temperature?: string;
			soilType?: string;
			careNotes?: string;
			healthStatus?: string;
		}
	) {
		await this.db
			.update(plants)
			.set({
				...analysis,
				updatedAt: new Date(),
			})
			.where(eq(plants.id, plantId));
	}
}
