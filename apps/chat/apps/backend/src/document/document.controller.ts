import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { isOk } from '@manacore/shared-errors';
import { DocumentService } from './document.service';
import { type Document } from '../db/schema/documents.schema';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Get('conversation/:conversationId')
	async getLatestDocument(
		@Param('conversationId') conversationId: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Document | null> {
		const result = await this.documentService.getLatestDocument(conversationId, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get('conversation/:conversationId/versions')
	async getAllDocumentVersions(
		@Param('conversationId') conversationId: string,
		@CurrentUser() user: CurrentUserData
	): Promise<Document[]> {
		const result = await this.documentService.getAllDocumentVersions(conversationId, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Get('conversation/:conversationId/exists')
	async hasDocument(
		@Param('conversationId') conversationId: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ exists: boolean }> {
		const result = await this.documentService.hasDocument(conversationId, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { exists: result.value };
	}

	@Post('conversation/:conversationId')
	async createDocument(
		@Param('conversationId') conversationId: string,
		@Body() body: { content: string },
		@CurrentUser() user: CurrentUserData
	): Promise<Document> {
		const result = await this.documentService.createDocument(
			conversationId,
			user.userId,
			body.content
		);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Post('conversation/:conversationId/version')
	async createDocumentVersion(
		@Param('conversationId') conversationId: string,
		@Body() body: { content: string },
		@CurrentUser() user: CurrentUserData
	): Promise<Document> {
		const result = await this.documentService.createDocumentVersion(
			conversationId,
			user.userId,
			body.content
		);

		if (!isOk(result)) {
			throw result.error;
		}

		return result.value;
	}

	@Delete(':id')
	async deleteDocumentVersion(
		@Param('id') id: string,
		@CurrentUser() user: CurrentUserData
	): Promise<{ success: boolean }> {
		const result = await this.documentService.deleteDocumentVersion(id, user.userId);

		if (!isOk(result)) {
			throw result.error;
		}

		return { success: true };
	}
}
