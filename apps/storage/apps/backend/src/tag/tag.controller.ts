import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TagService } from './tag.service';

@Controller('api/v1/tags')
@UseGuards(JwtAuthGuard)
export class TagController {
	constructor(private readonly tagService: TagService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.tagService.findAll(user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: { name: string; color?: string }) {
		return this.tagService.create(user.userId, dto.name, dto.color);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: { name?: string; color?: string }
	) {
		return this.tagService.update(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.tagService.delete(user.userId, id);
		return { success: true };
	}
}
