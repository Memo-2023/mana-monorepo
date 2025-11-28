import { Controller, Get, Param } from '@nestjs/common';
import { ModelService } from './model.service';

@Controller('models')
export class ModelController {
	constructor(private readonly modelService: ModelService) {}

	// Models are public - no auth required
	@Get()
	async getActiveModels() {
		return this.modelService.getActiveModels();
	}

	@Get(':id')
	async getModelById(@Param('id') id: string) {
		return this.modelService.getModelById(id);
	}
}
