import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ReminderService } from './reminder.service';
import { CreateReminderDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReminderController {
	constructor(private readonly reminderService: ReminderService) {}

	@Get('events/:eventId/reminders')
	async findByEvent(@CurrentUser() user: CurrentUserData, @Param('eventId') eventId: string) {
		const reminders = await this.reminderService.findByEvent(eventId, user.userId);
		return { reminders };
	}

	@Post('events/:eventId/reminders')
	async create(
		@CurrentUser() user: CurrentUserData,
		@Param('eventId') eventId: string,
		@Body() dto: Omit<CreateReminderDto, 'eventId'>
	) {
		const reminder = await this.reminderService.create(user.userId, {
			...dto,
			eventId,
		});
		return { reminder };
	}

	@Delete('reminders/:id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.reminderService.delete(id, user.userId);
		return { success: true };
	}
}
