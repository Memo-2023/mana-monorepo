import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtAuthGuard } from '@manacore/shared-nestjs-auth';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
	constructor(private readonly tagService: TagService) {}

	@Get()
	async getAllTags() {
		return this.tagService.getAllTags();
	}

	@Post()
	async createTag(@Body() dto: CreateTagDto) {
		return this.tagService.createTag(dto);
	}

	@Patch(':id')
	async updateTag(@Param('id') id: string, @Body() dto: UpdateTagDto) {
		return this.tagService.updateTag(id, dto);
	}

	@Delete(':id')
	async deleteTag(@Param('id') id: string) {
		return this.tagService.deleteTag(id);
	}

	@Get('image/:imageId')
	async getImageTags(@Param('imageId') imageId: string) {
		return this.tagService.getImageTags(imageId);
	}

	@Post('image/:imageId/:tagId')
	async addTagToImage(@Param('imageId') imageId: string, @Param('tagId') tagId: string) {
		return this.tagService.addTagToImage(imageId, tagId);
	}

	@Delete('image/:imageId/:tagId')
	async removeTagFromImage(@Param('imageId') imageId: string, @Param('tagId') tagId: string) {
		return this.tagService.removeTagFromImage(imageId, tagId);
	}
}
