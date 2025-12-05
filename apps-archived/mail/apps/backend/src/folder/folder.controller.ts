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
	ParseUUIDPipe,
	BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { FolderService } from './folder.service';
import { CreateFolderDto, UpdateFolderDto, FolderQueryDto } from './dto/folder.dto';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FolderController {
	constructor(private readonly folderService: FolderService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: FolderQueryDto) {
		const folders = await this.folderService.findByUserId(user.userId, query);
		return { folders };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const folder = await this.folderService.findById(id, user.userId);
		if (!folder) {
			return { folder: null };
		}
		return { folder };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateFolderDto) {
		const folder = await this.folderService.create({
			...dto,
			userId: user.userId,
			type: 'custom',
			path: dto.name, // For custom folders, path is the name
			isSystem: false,
		});
		return { folder };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateFolderDto
	) {
		const existingFolder = await this.folderService.findById(id, user.userId);
		if (!existingFolder) {
			throw new BadRequestException('Folder not found');
		}

		// Don't allow renaming system folders
		if (existingFolder.isSystem && dto.name) {
			throw new BadRequestException('Cannot rename system folders');
		}

		const folder = await this.folderService.update(id, user.userId, dto);
		return { folder };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.folderService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/hide')
	async toggleHidden(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const folder = await this.folderService.findById(id, user.userId);
		if (!folder) {
			throw new BadRequestException('Folder not found');
		}

		const updatedFolder = await this.folderService.update(id, user.userId, {
			isHidden: !folder.isHidden,
		});
		return { folder: updatedFolder };
	}
}
