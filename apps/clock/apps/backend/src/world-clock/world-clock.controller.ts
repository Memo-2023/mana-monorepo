import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { WorldClockService } from './world-clock.service';
import { CreateWorldClockDto, ReorderWorldClocksDto } from './dto';

@Controller('world-clocks')
@UseGuards(JwtAuthGuard)
export class WorldClockController {
	constructor(private readonly worldClockService: WorldClockService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		return this.worldClockService.findAll(user.userId);
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateWorldClockDto) {
		return this.worldClockService.create(user.userId, dto);
	}

	@Put('reorder')
	async reorder(@CurrentUser() user: CurrentUserData, @Body() dto: ReorderWorldClocksDto) {
		return this.worldClockService.reorder(user.userId, dto.ids);
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.worldClockService.delete(id, user.userId);
		return { success: true };
	}
}

@Controller('timezones')
export class TimezoneController {
	constructor(private readonly worldClockService: WorldClockService) {}

	@Get('search')
	async search(@Query('q') query: string) {
		return this.worldClockService.searchTimezones(query);
	}
}
