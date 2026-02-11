import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Param,
	Body,
	UseGuards,
	NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TagService } from './tag.service';
import { CreateTagDto, UpdateTagDto, SetTagsDto } from './dto';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
	constructor(private tagService: TagService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.tagService.findAll(user.userId);
	}

	@Post()
	async create(@Body() dto: CreateTagDto, @CurrentUser() user: CurrentUserData) {
		return this.tagService.create(user.userId, dto);
	}

	@Patch(':id')
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateTagDto,
		@CurrentUser() user: CurrentUserData
	) {
		const tag = await this.tagService.update(id, user.userId, dto);
		if (!tag) {
			throw new NotFoundException('Tag not found');
		}
		return tag;
	}

	@Delete(':id')
	async delete(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
		await this.tagService.delete(id, user.userId);
		return { success: true };
	}
}

@Controller('photos')
@UseGuards(JwtAuthGuard)
export class PhotoTagController {
	constructor(private tagService: TagService) {}

	@Get(':mediaId/tags')
	async getPhotoTags(@Param('mediaId') mediaId: string) {
		return this.tagService.getTagsForPhoto(mediaId);
	}

	@Post(':mediaId/tags/:tagId')
	async addTag(
		@Param('mediaId') mediaId: string,
		@Param('tagId') tagId: string,
		@CurrentUser() user: CurrentUserData
	) {
		await this.tagService.addTagToPhoto(mediaId, tagId, user.userId);
		return { success: true };
	}

	@Delete(':mediaId/tags/:tagId')
	async removeTag(@Param('mediaId') mediaId: string, @Param('tagId') tagId: string) {
		await this.tagService.removeTagFromPhoto(mediaId, tagId);
		return { success: true };
	}

	@Patch(':mediaId/tags')
	async setTags(
		@Param('mediaId') mediaId: string,
		@Body() dto: SetTagsDto,
		@CurrentUser() user: CurrentUserData
	) {
		await this.tagService.setTagsForPhoto(mediaId, dto.tagIds, user.userId);
		return { success: true };
	}
}
