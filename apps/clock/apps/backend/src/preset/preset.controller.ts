import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { PresetService } from './preset.service';
import { CreatePresetDto, UpdatePresetDto } from './dto';

@Controller('presets')
@UseGuards(JwtAuthGuard)
export class PresetController {
	constructor(private readonly presetService: PresetService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.presetService.findAll(user.userId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.presetService.findByIdOrThrow(id, user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreatePresetDto) {
		return this.presetService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdatePresetDto
	) {
		return this.presetService.update(id, user.userId, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.presetService.delete(id, user.userId);
		return { success: true };
	}
}
