import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReminderController {
	constructor(private readonly reminderService: ReminderService) {}

	@Get('tasks/:taskId/reminders')
	async findByTask(@CurrentUser() user: CurrentUserData, @Param('taskId') taskId: string) {
		const reminders = await this.reminderService.findByTask(taskId, user.userId);
		return { reminders };
	}

	@Post('tasks/:taskId/reminders')
	async create(
		@CurrentUser() user: CurrentUserData,
		@Param('taskId') taskId: string,
		@Body() dto: CreateReminderDto
	) {
		const reminder = await this.reminderService.create(taskId, user.userId, dto);
		return { reminder };
	}

	@Delete('reminders/:id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.reminderService.delete(id, user.userId);
		return { success: true };
	}
}
