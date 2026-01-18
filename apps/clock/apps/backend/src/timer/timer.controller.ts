import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TimerService } from './timer.service';
import { CreateTimerDto, UpdateTimerDto } from './dto';

@Controller('timers')
@UseGuards(JwtAuthGuard)
export class TimerController {
	constructor(private readonly timerService: TimerService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.timerService.findAll(user.userId);
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.timerService.findByIdOrThrow(id, user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTimerDto) {
		return this.timerService.create(user.userId, dto);
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateTimerDto
	) {
		return this.timerService.update(id, user.userId, dto);
	}

	@Post(':id/start')
	async start(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.timerService.start(id, user.userId);
	}

	@Post(':id/pause')
	async pause(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.timerService.pause(id, user.userId);
	}

	@Post(':id/reset')
	async reset(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		return this.timerService.reset(id, user.userId);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.timerService.delete(id, user.userId);
		return { success: true };
	}
}
