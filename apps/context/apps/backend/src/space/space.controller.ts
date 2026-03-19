import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SpaceService } from './space.service';

@Controller('spaces')
@UseGuards(JwtAuthGuard)
export class SpaceController {
	constructor(private readonly spaceService: SpaceService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const spaces = await this.spaceService.findAll(user.userId);
		return { spaces };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const space = await this.spaceService.findByIdOrThrow(id, user.userId);
		return { space };
	}

	@Post()
	async create(
		@CurrentUser() user: CurrentUserData,
		@Body() body: { name: string; description?: string; pinned?: boolean; prefix?: string }
	) {
		const space = await this.spaceService.create(user.userId, body);
		return { space };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body()
		body: Partial<{
			name: string;
			description: string;
			pinned: boolean;
			prefix: string;
			settings: Record<string, unknown>;
		}>
	) {
		const space = await this.spaceService.update(id, user.userId, body);
		return { space };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.spaceService.delete(id, user.userId);
		return { success: true };
	}
}
