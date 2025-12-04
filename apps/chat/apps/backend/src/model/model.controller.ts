import { Controller, Get, Param } from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import { type ModelService } from './model.service';
import { type Model } from '../db/schema/models.schema';

// Models are publicly accessible - no auth required to list available models
@Controller('models')
export class ModelController {
	constructor(private readonly modelService: ModelService) {}

	@Get()
	async getModels(): Promise<Model[]> {
		const result = await this.modelService.getModels();

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get(':id')
	async getModel(@Param('id') id: string): Promise<Model> {
		const result = await this.modelService.getModel(id);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}
}
