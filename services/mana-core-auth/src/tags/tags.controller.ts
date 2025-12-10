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
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { CreateTagDto, UpdateTagDto } from './dto';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
	constructor(private readonly tagsService: TagsService) {}

	/**
	 * Get all tags for the authenticated user
	 */
	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.tagsService.findByUserId(user.userId);
	}

	/**
	 * Get multiple tags by IDs
	 * Used by apps to resolve tagIds to full tag objects
	 * Query: ?ids=id1,id2,id3
	 */
	@Get('by-ids')
	async getByIds(@CurrentUser() user: CurrentUserData, @Query('ids') ids?: string) {
		if (!ids) {
			return [];
		}
		const idArray = ids.split(',').filter((id) => id.trim());
		return this.tagsService.getByIds(idArray, user.userId);
	}

	/**
	 * Get a single tag by ID
	 */
	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.tagsService.findById(id, user.userId);
	}

	/**
	 * Create a new tag
	 */
	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() createTagDto: CreateTagDto) {
		return this.tagsService.create(user.userId, createTagDto);
	}

	/**
	 * Create default tags for the user (if not already created)
	 * Called on first access or explicitly
	 */
	@Post('defaults')
	async createDefaults(@CurrentUser() user: CurrentUserData) {
		return this.tagsService.createDefaultTags(user.userId);
	}

	/**
	 * Update an existing tag
	 */
	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() updateTagDto: UpdateTagDto
	) {
		return this.tagsService.update(id, user.userId, updateTagDto);
	}

	/**
	 * Delete a tag
	 */
	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.tagsService.delete(id, user.userId);
	}
}
