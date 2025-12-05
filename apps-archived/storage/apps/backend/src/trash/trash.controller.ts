import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, type CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TrashService } from './trash.service';

@Controller('api/v1/trash')
@UseGuards(JwtAuthGuard)
export class TrashController {
	constructor(private readonly trashService: TrashService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.trashService.findAll(user.userId);
	}

	@Post(':id/restore')
	async restore(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Query('type') type: 'file' | 'folder'
	) {
		if (type === 'folder') {
			return this.trashService.restoreFolder(user.userId, id);
		}
		return this.trashService.restoreFile(user.userId, id);
	}

	@Delete(':id')
	async permanentlyDelete(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Query('type') type: 'file' | 'folder'
	) {
		if (type === 'folder') {
			await this.trashService.permanentlyDeleteFolder(user.userId, id);
		} else {
			await this.trashService.permanentlyDeleteFile(user.userId, id);
		}
		return { success: true };
	}

	@Delete()
	async emptyTrash(@CurrentUser() user: CurrentUserData) {
		await this.trashService.emptyTrash(user.userId);
		return { success: true };
	}
}
