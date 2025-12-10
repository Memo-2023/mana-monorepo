import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, QueryTasksDto } from './dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
	constructor(private readonly taskService: TaskService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: QueryTasksDto) {
		const tasks = await this.taskService.findAll(user.userId, query);
		return { tasks };
	}

	@Get('inbox')
	async getInbox(@CurrentUser() user: CurrentUserData) {
		const tasks = await this.taskService.getInboxTasks(user.userId);
		return { tasks };
	}

	@Get('today')
	async getToday(@CurrentUser() user: CurrentUserData) {
		const tasks = await this.taskService.getTodayTasks(user.userId);
		return { tasks };
	}

	@Get('upcoming')
	async getUpcoming(@CurrentUser() user: CurrentUserData, @Query('days') days?: number) {
		const tasks = await this.taskService.getUpcomingTasks(user.userId, days ?? 7);
		return { tasks };
	}

	@Get('completed')
	async getCompleted(
		@CurrentUser() user: CurrentUserData,
		@Query('limit') limit?: number,
		@Query('offset') offset?: number
	) {
		const result = await this.taskService.getCompletedTasks(user.userId, limit ?? 50, offset ?? 0);
		return result;
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const task = await this.taskService.findByIdOrThrow(id, user.userId);
		return { task };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTaskDto) {
		const task = await this.taskService.create(user.userId, dto);
		return { task };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateTaskDto
	) {
		const task = await this.taskService.update(id, user.userId, dto);
		return { task };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.taskService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/complete')
	async complete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const task = await this.taskService.complete(id, user.userId);
		return { task };
	}

	@Post(':id/uncomplete')
	async uncomplete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const task = await this.taskService.uncomplete(id, user.userId);
		return { task };
	}

	@Post(':id/move')
	async move(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body('projectId') projectId: string | null
	) {
		const task = await this.taskService.move(id, user.userId, projectId);
		return { task };
	}

	@Put(':id/labels')
	async updateLabels(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body('labelIds') labelIds: string[]
	) {
		await this.taskService.updateTaskLabels(id, user.userId, labelIds);
		const task = await this.taskService.findByIdOrThrow(id, user.userId);
		return { task };
	}

	@Put('reorder')
	async reorder(
		@CurrentUser() user: CurrentUserData,
		@Body('taskIds') taskIds: string[],
		@Body('projectId') projectId?: string | null
	) {
		const tasks = await this.taskService.reorder(user.userId, taskIds, projectId);
		return { tasks };
	}
}
