import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { UseCredits } from '@manacore/nestjs-integration';
import { CreditOperationType } from '@manacore/credit-operations';
import { EventService } from './event.service';
import { CreateEventDto, UpdateEventDto, QueryEventsDto } from './dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventController {
	constructor(private readonly eventService: EventService) {}

	@Get()
	async queryEvents(@CurrentUser() user: CurrentUserData, @Query() query: QueryEventsDto) {
		const events = await this.eventService.getEventsWithCalendar(user.userId, query);
		return {
			events,
			pagination: {
				limit: query.limit,
				offset: query.offset ?? 0,
				count: events.length,
			},
		};
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const event = await this.eventService.findByIdOrThrow(id, user.userId);
		return { event };
	}

	@Get('calendar/:calendarId')
	async findByCalendar(
		@CurrentUser() user: CurrentUserData,
		@Param('calendarId') calendarId: string,
		@Query() query: QueryEventsDto
	) {
		const events = await this.eventService.findByCalendar(calendarId, user.userId, query);
		return { events };
	}

	@Post()
	@UseCredits(CreditOperationType.EVENT_CREATE)
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateEventDto) {
		const event = await this.eventService.create(user.userId, dto);
		return { event };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateEventDto
	) {
		const event = await this.eventService.update(id, user.userId, dto);
		return { event };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.eventService.delete(id, user.userId);
		return { success: true };
	}
}
