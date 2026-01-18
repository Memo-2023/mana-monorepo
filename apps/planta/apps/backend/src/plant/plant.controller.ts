import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PlantService } from './plant.service';
import { CreatePlantDto } from './dto/create-plant.dto';
import { UpdatePlantDto } from './dto/update-plant.dto';

@Controller('plants')
@UseGuards(JwtAuthGuard)
export class PlantController {
	constructor(private readonly plantService: PlantService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.plantService.findAll(user.userId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.plantService.findOne(id, user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePlantDto) {
		return this.plantService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData,
		@Body() dto: UpdatePlantDto
	) {
		return this.plantService.update(id, user.userId, dto);
	}

	@Delete(':id')
	async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.plantService.delete(id, user.userId);
	}
}
