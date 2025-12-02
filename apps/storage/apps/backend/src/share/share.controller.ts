import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ShareService } from './share.service';

@Controller('api/v1/shares')
export class ShareController {
	constructor(private readonly shareService: ShareService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.shareService.findAll(user.userId);
	}

	@Get(':token')
	async findByToken(@Param('token') token: string) {
		return this.shareService.findByToken(token);
	}

	@Post()
	@UseGuards(JwtAuthGuard)
	async create(
		@CurrentUser() user: CurrentUserData,
		@Body()
		dto: {
			fileId?: string;
			folderId?: string;
			accessLevel?: 'view' | 'edit' | 'download';
			password?: string;
			maxDownloads?: number;
			expiresInDays?: number;
		}
	) {
		const expiresAt = dto.expiresInDays
			? new Date(Date.now() + dto.expiresInDays * 24 * 60 * 60 * 1000)
			: undefined;

		return this.shareService.create(user.userId, {
			fileId: dto.fileId,
			folderId: dto.folderId,
			accessLevel: dto.accessLevel,
			password: dto.password,
			maxDownloads: dto.maxDownloads,
			expiresAt,
		});
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.shareService.delete(user.userId, id);
		return { success: true };
	}
}
