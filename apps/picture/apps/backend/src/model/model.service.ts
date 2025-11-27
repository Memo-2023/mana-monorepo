import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { models, type Model } from '../db/schema';

@Injectable()
export class ModelService {
	private readonly logger = new Logger(ModelService.name);

	constructor(@Inject(DATABASE_CONNECTION) private readonly db: Database) {}

	async getActiveModels(): Promise<Model[]> {
		try {
			const result = await this.db
				.select()
				.from(models)
				.where(eq(models.isActive, true))
				.orderBy(desc(models.isDefault), models.sortOrder);

			return result;
		} catch (error) {
			this.logger.error('Error fetching active models', error);
			throw error;
		}
	}

	async getModelById(id: string): Promise<Model> {
		try {
			const result = await this.db.select().from(models).where(eq(models.id, id)).limit(1);

			if (result.length === 0) {
				throw new NotFoundException(`Model with id ${id} not found`);
			}

			return result[0];
		} catch (error) {
			if (error instanceof NotFoundException) {
				throw error;
			}
			this.logger.error(`Error fetching model ${id}`, error);
			throw error;
		}
	}
}
