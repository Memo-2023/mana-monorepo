import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { DocumentService } from './document.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Query('spaceId') spaceId?: string,
		@Query('limit') limit?: string,
		@Query('preview') preview?: string
	) {
		if (preview === 'true') {
			const documents = await this.documentService.findAllWithPreview(
				user.userId,
				spaceId,
				limit ? parseInt(limit, 10) : 50
			);
			return { documents };
		}
		const documents = await this.documentService.findAll(user.userId, spaceId);
		return { documents };
	}

	@Get('recent')
	async getRecent(@CurrentUser() user: CurrentUserData, @Query('limit') limit?: string) {
		const documents = await this.documentService.findRecent(
			user.userId,
			limit ? parseInt(limit, 10) : 5
		);
		return { documents };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const document = await this.documentService.findByIdOrThrow(id, user.userId);
		return { document };
	}

	@Get(':id/versions')
	async getVersions(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const documents = await this.documentService.getVersions(id, user.userId);
		return { documents };
	}

	@Post()
	async create(
		@CurrentUser() user: CurrentUserData,
		@Body()
		body: {
			content: string;
			type: 'text' | 'context' | 'prompt';
			spaceId?: string;
			title?: string;
			metadata?: Record<string, unknown>;
		}
	) {
		const document = await this.documentService.create(user.userId, body);
		return { document };
	}

	@Post(':id/versions')
	async createVersion(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body()
		body: {
			content: string;
			generationType: 'summary' | 'continuation' | 'rewrite' | 'ideas';
			model: string;
			prompt: string;
		}
	) {
		const document = await this.documentService.createVersion(id, user.userId, body);
		return { document };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() body: Record<string, unknown>
	) {
		const document = await this.documentService.update(id, user.userId, body);
		return { document };
	}

	@Put(':id/tags')
	async updateTags(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() body: { tags: string[] }
	) {
		const document = await this.documentService.updateTags(id, user.userId, body.tags);
		return { document };
	}

	@Put(':id/pinned')
	async togglePinned(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() body: { pinned: boolean }
	) {
		const document = await this.documentService.togglePinned(id, user.userId, body.pinned);
		return { document };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.documentService.delete(id, user.userId);
		return { success: true };
	}
}
