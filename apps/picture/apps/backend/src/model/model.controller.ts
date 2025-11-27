import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ModelService } from './model.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('models')
@UseGuards(JwtAuthGuard)
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Get()
  async getActiveModels() {
    return this.modelService.getActiveModels();
  }

  @Get(':id')
  async getModelById(@Param('id') id: string) {
    return this.modelService.getModelById(id);
  }
}
