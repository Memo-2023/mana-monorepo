import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
	constructor(private readonly projectService: ProjectService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const projectsList = await this.projectService.findByUserId(user.userId);
		return { projects: projectsList };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const project = await this.projectService.getProjectWithRelations(id, user.userId);
		return { project };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateProjectDto) {
		const project = await this.projectService.create({
			userId: user.userId,
			title: dto.title,
			description: dto.description,
		});
		return { project };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateProjectDto
	) {
		const project = await this.projectService.update(id, user.userId, dto);
		return { project };
	}

	@Post('from-song/:songId')
	async createFromSong(
		@CurrentUser() user: CurrentUserData,
		@Param('songId', ParseUUIDPipe) songId: string
	) {
		const project = await this.projectService.createFromSong(songId, user.userId);
		return { project };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.projectService.delete(id, user.userId);
		return { success: true };
	}
}
