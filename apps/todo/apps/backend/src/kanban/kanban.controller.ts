import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { KanbanService } from './kanban.service';
import {
	CreateBoardDto,
	UpdateBoardDto,
	ReorderBoardsDto,
	CreateColumnDto,
	UpdateColumnDto,
	ReorderColumnsDto,
	MoveTaskToColumnDto,
	ReorderTasksDto,
} from './dto';

@Controller('kanban')
@UseGuards(JwtAuthGuard)
export class KanbanController {
	constructor(private readonly kanbanService: KanbanService) {}

	// =====================
	// Board endpoints
	// =====================

	@Get('boards')
	async getBoards(@CurrentUser() user: CurrentUserData) {
		const boards = await this.kanbanService.findAllBoards(user.userId);
		return { boards };
	}

	@Get('boards/global')
	async getGlobalBoard(@CurrentUser() user: CurrentUserData) {
		const board = await this.kanbanService.getOrCreateGlobalBoard(user.userId);
		return { board };
	}

	@Get('boards/:id')
	async getBoard(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const board = await this.kanbanService.findBoardByIdOrThrow(id, user.userId);
		return { board };
	}

	@Post('boards')
	async createBoard(@CurrentUser() user: CurrentUserData, @Body() dto: CreateBoardDto) {
		const board = await this.kanbanService.createBoard(user.userId, dto);
		return { board };
	}

	@Put('boards/reorder')
	async reorderBoards(@CurrentUser() user: CurrentUserData, @Body() dto: ReorderBoardsDto) {
		const boards = await this.kanbanService.reorderBoards(user.userId, dto.boardIds);
		return { boards };
	}

	@Put('boards/:id')
	async updateBoard(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateBoardDto
	) {
		const board = await this.kanbanService.updateBoard(id, user.userId, dto);
		return { board };
	}

	@Delete('boards/:id')
	async deleteBoard(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.kanbanService.deleteBoard(id, user.userId);
		return { success: true };
	}

	// =====================
	// Column endpoints
	// =====================

	@Get('columns')
	async getColumns(@CurrentUser() user: CurrentUserData, @Query('boardId') boardId: string) {
		const columns = await this.kanbanService.findAllColumns(boardId, user.userId);
		return { columns };
	}

	@Post('columns')
	async createColumn(@CurrentUser() user: CurrentUserData, @Body() dto: CreateColumnDto) {
		const column = await this.kanbanService.createColumn(user.userId, dto);
		return { column };
	}

	@Put('columns/:id')
	async updateColumn(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateColumnDto
	) {
		const column = await this.kanbanService.updateColumn(id, user.userId, dto);
		return { column };
	}

	@Delete('columns/:id')
	async deleteColumn(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.kanbanService.deleteColumn(id, user.userId);
		return { success: true };
	}

	@Put('columns/reorder')
	async reorderColumns(@CurrentUser() user: CurrentUserData, @Body() dto: ReorderColumnsDto) {
		const columns = await this.kanbanService.reorderColumns(user.userId, dto.columnIds);
		return { columns };
	}

	@Post('columns/init')
	async initializeColumns(@CurrentUser() user: CurrentUserData, @Query('boardId') boardId: string) {
		const columns = await this.kanbanService.initializeDefaultColumns(boardId, user.userId);
		return { columns };
	}

	// =====================
	// Task endpoints
	// =====================

	@Get('tasks')
	async getTasksGrouped(@CurrentUser() user: CurrentUserData, @Query('boardId') boardId: string) {
		const result = await this.kanbanService.getTasksGroupedByColumn(boardId, user.userId);
		return result;
	}

	@Post('tasks/:taskId/move')
	async moveTaskToColumn(
		@CurrentUser() user: CurrentUserData,
		@Param('taskId') taskId: string,
		@Body() dto: MoveTaskToColumnDto
	) {
		const task = await this.kanbanService.moveTaskToColumn(
			taskId,
			user.userId,
			dto.columnId,
			dto.order
		);
		return { task };
	}

	@Put('tasks/reorder')
	async reorderTasks(@CurrentUser() user: CurrentUserData, @Body() dto: ReorderTasksDto) {
		const tasks = await this.kanbanService.reorderTasksInColumn(
			user.userId,
			dto.columnId,
			dto.taskIds
		);
		return { tasks };
	}
}
