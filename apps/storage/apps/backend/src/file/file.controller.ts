import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	UseInterceptors,
	UploadedFile,
	UploadedFiles,
	Res,
	BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FileService } from './file.service';
import { CreateFileDto, UpdateFileDto, MoveFileDto } from './dto/create-file.dto';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;

@Controller('api/v1/files')
@UseGuards(JwtAuthGuard)
export class FileController {
	constructor(private readonly fileService: FileService) {}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Query('parentFolderId') parentFolderId?: string
	) {
		return this.fileService.findAll(user.userId, parentFolderId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.fileService.findOne(user.userId, id);
	}

	@Post('upload')
	@UseInterceptors(
		FileInterceptor('file', {
			limits: { fileSize: MAX_FILE_SIZE },
		})
	)
	async upload(
		@CurrentUser() user: CurrentUserData,
		@UploadedFile() file: Express.Multer.File,
		@Body() dto: CreateFileDto
	) {
		if (!file) {
			throw new BadRequestException('No file provided');
		}
		return this.fileService.upload(user.userId, file, dto);
	}

	@Post('upload-multiple')
	@UseInterceptors(
		FilesInterceptor('files', MAX_FILES, {
			limits: { fileSize: MAX_FILE_SIZE },
		})
	)
	async uploadMultiple(
		@CurrentUser() user: CurrentUserData,
		@UploadedFiles() uploadedFiles: Express.Multer.File[],
		@Body() dto: CreateFileDto
	) {
		if (!uploadedFiles || uploadedFiles.length === 0) {
			throw new BadRequestException('No files provided');
		}

		const results = await Promise.all(
			uploadedFiles.map((file) => this.fileService.upload(user.userId, file, dto))
		);

		return results;
	}

	@Get(':id/download')
	async download(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Query('url') urlOnly: string,
		@Res() res: Response
	) {
		if (urlOnly === 'true') {
			const url = await this.fileService.getDownloadUrl(user.userId, id);
			return res.json({ url });
		}

		const { buffer, file } = await this.fileService.download(user.userId, id);

		res.set({
			'Content-Type': file.mimeType,
			'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
			'Content-Length': buffer.length,
		});

		res.send(buffer);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateFileDto
	) {
		return this.fileService.update(user.userId, id, dto);
	}

	@Patch(':id/move')
	async move(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: MoveFileDto
	) {
		return this.fileService.move(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.fileService.delete(user.userId, id);
		return { success: true };
	}

	@Post(':id/favorite')
	async toggleFavorite(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.fileService.toggleFavorite(user.userId, id);
	}
}
