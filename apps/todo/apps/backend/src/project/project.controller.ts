import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, ReorderProjectsDto } from './dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
	constructor(private readonly projectService: ProjectService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		// Ensure user has at least an inbox project
		await this.projectService.getOrCreateDefaultProject(user.userId);
		const projects = await this.projectService.findAll(user.userId);
		return { projects };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const project = await this.projectService.findByIdOrThrow(id, user.userId);
		return { project };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateProjectDto) {
		const project = await this.projectService.create(user.userId, dto);
		return { project };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateProjectDto
	) {
		const project = await this.projectService.update(id, user.userId, dto);
		return { project };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.projectService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/archive')
	async archive(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const project = await this.projectService.archive(id, user.userId);
		return { project };
	}

	@Post(':id/unarchive')
	async unarchive(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const project = await this.projectService.unarchive(id, user.userId);
		return { project };
	}

	@Put('reorder')
	async reorder(@CurrentUser() user: CurrentUserData, @Body() dto: ReorderProjectsDto) {
		const projects = await this.projectService.reorder(user.userId, dto.projectIds);
		return { projects };
	}
}
