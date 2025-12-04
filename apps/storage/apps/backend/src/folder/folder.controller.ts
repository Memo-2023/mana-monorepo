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
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FolderService } from './folder.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto, MoveFolderDto } from './dto/update-folder.dto';

@Controller('api/v1/folders')
@UseGuards(JwtAuthGuard)
export class FolderController {
	constructor(private readonly folderService: FolderService) {}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Query('parentFolderId') parentFolderId?: string
	) {
		return this.folderService.findAll(user.userId, parentFolderId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.folderService.findOne(user.userId, id);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateFolderDto) {
		return this.folderService.create(user.userId, dto);
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateFolderDto
	) {
		return this.folderService.update(user.userId, id, dto);
	}

	@Patch(':id/move')
	async move(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: MoveFolderDto
	) {
		return this.folderService.move(user.userId, id, dto);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.folderService.delete(user.userId, id);
		return { success: true };
	}

	@Post(':id/favorite')
	async toggleFavorite(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.folderService.toggleFavorite(user.userId, id);
	}
}
