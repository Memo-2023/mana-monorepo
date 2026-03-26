import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { TagLinksService } from './tag-links.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import {
	CreateTagLinkDto,
	BulkCreateTagLinksDto,
	SyncTagLinksDto,
} from './dto/create-tag-link.dto';
import { QueryTagLinksDto } from './dto/query-tag-links.dto';

@Controller('tag-links')
@UseGuards(JwtAuthGuard)
export class TagLinksController {
	constructor(private readonly tagLinksService: TagLinksService) {}

	/**
	 * Link a tag to an entity
	 */
	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTagLinkDto) {
		return this.tagLinksService.create(user.userId, dto);
	}

	/**
	 * Bulk link tags to entities
	 */
	@Post('bulk')
	async bulkCreate(@CurrentUser() user: CurrentUserData, @Body() dto: BulkCreateTagLinksDto) {
		return this.tagLinksService.bulkCreate(user.userId, dto.links);
	}

	/**
	 * Sync tags for an entity (replaces all tag links)
	 */
	@Put('sync')
	async sync(@CurrentUser() user: CurrentUserData, @Body() dto: SyncTagLinksDto) {
		return this.tagLinksService.sync(
			user.userId,
			dto.appId,
			dto.entityId,
			dto.entityType,
			dto.tagIds
		);
	}

	/**
	 * Get full Tag objects for a specific entity
	 */
	@Get('tags-for-entity')
	async getTagsForEntity(
		@CurrentUser() user: CurrentUserData,
		@Query('appId') appId: string,
		@Query('entityId') entityId: string
	) {
		return this.tagLinksService.getTagsForEntity(user.userId, appId, entityId);
	}

	/**
	 * Query tag links with optional filters
	 */
	@Get()
	async query(@CurrentUser() user: CurrentUserData, @Query() query: QueryTagLinksDto) {
		return this.tagLinksService.query(user.userId, query);
	}

	/**
	 * Delete a tag link by ID
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.tagLinksService.delete(id, user.userId);
	}
}
