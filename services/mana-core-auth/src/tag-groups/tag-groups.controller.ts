import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { TagGroupsService } from './tag-groups.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateTagGroupDto, UpdateTagGroupDto } from './dto';

@Controller('tag-groups')
@UseGuards(JwtAuthGuard)
export class TagGroupsController {
	constructor(private readonly tagGroupsService: TagGroupsService) {}

	/**
	 * Get all tag groups for the authenticated user
	 */
	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.tagGroupsService.findByUserId(user.userId);
	}

	/**
	 * Create a new tag group
	 */
	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTagGroupDto) {
		return this.tagGroupsService.create(user.userId, dto);
	}

	/**
	 * Reorder tag groups
	 */
	@Put('reorder')
	async reorder(@CurrentUser() user: CurrentUserData, @Body() body: { ids: string[] }) {
		return this.tagGroupsService.reorder(user.userId, body.ids);
	}

	/**
	 * Update an existing tag group
	 */
	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateTagGroupDto
	) {
		return this.tagGroupsService.update(id, user.userId, dto);
	}

	/**
	 * Delete a tag group (tags in group get groupId = null)
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.tagGroupsService.delete(id, user.userId);
	}
}
