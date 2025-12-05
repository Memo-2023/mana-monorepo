import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AlarmService } from './alarm.service';
import { CreateAlarmDto, UpdateAlarmDto } from './dto';

@Controller('alarms')
@UseGuards(JwtAuthGuard)
export class AlarmController {
	constructor(private readonly alarmService: AlarmService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.alarmService.findAll(user.userId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.alarmService.findByIdOrThrow(id, user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAlarmDto) {
		return this.alarmService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateAlarmDto
	) {
		return this.alarmService.update(id, user.userId, dto);
	}

	@Patch(':id/toggle')
	async toggle(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.alarmService.toggle(id, user.userId);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.alarmService.delete(id, user.userId);
		return { success: true };
	}
}
