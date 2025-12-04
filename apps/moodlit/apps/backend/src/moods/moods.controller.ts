import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { MoodsService } from './moods.service';
import { CreateMoodDto, UpdateMoodDto } from './dto';

@Controller('moods')
@UseGuards(JwtAuthGuard)
export class MoodsController {
	constructor(private readonly moodsService: MoodsService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.moodsService.findAllByUser(user.userId);
	}

	@Get(':id')
	async findOne(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		return this.moodsService.findOne(id, user.userId);
	}

	@Post()
	async create(@Body() dto: CreateMoodDto, @CurrentUser() user: CurrentUserData) {
		return this.moodsService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateMoodDto,
		@CurrentUser() user: CurrentUserData
	) {
		return this.moodsService.update(id, user.userId, dto);
	}

	@Delete(':id')
	async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		await this.moodsService.delete(id, user.userId);
		return { success: true };
	}
}
