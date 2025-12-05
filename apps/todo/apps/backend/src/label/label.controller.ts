import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { LabelService } from './label.service';
import { CreateLabelDto, UpdateLabelDto } from './dto';

@Controller('labels')
@UseGuards(JwtAuthGuard)
export class LabelController {
	constructor(private readonly labelService: LabelService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const labels = await this.labelService.findAll(user.userId);
		return { labels };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const label = await this.labelService.findByIdOrThrow(id, user.userId);
		return { label };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateLabelDto) {
		const label = await this.labelService.create(user.userId, dto);
		return { label };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateLabelDto
	) {
		const label = await this.labelService.update(id, user.userId, dto);
		return { label };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.labelService.delete(id, user.userId);
		return { success: true };
	}
}
