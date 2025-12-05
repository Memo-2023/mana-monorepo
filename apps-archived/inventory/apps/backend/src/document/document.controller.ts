import {
	Controller,
	Post,
	Delete,
	Get,
	Param,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { DocumentService } from './document.service';
import type { DocumentType } from '@inventory/shared';

@Controller('api/v1/items/:itemId/documents')
@UseGuards(JwtAuthGuard)
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Post()
	@UseInterceptors(FileInterceptor('document', { limits: { fileSize: 20 * 1024 * 1024 } }))
	async uploadDocument(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@UploadedFile() file: Express.Multer.File,
		@Body('documentType') documentType?: DocumentType
	) {
		return this.documentService.uploadDocument(user.userId, itemId, file, documentType);
	}

	@Delete(':documentId')
	async deleteDocument(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@Param('documentId') documentId: string
	) {
		return this.documentService.deleteDocument(user.userId, itemId, documentId);
	}

	@Get(':documentId/download')
	async getDownloadUrl(
		@CurrentUser() user: CurrentUserData,
		@Param('itemId') itemId: string,
		@Param('documentId') documentId: string
	) {
		return this.documentService.getDownloadUrl(user.userId, itemId, documentId);
	}
}
