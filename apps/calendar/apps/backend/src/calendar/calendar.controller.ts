import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { CalendarService } from './calendar.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto';

@Controller('calendars')
@UseGuards(JwtAuthGuard)
export class CalendarController {
	constructor(private readonly calendarService: CalendarService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		let calendars = await this.calendarService.findAll(user.userId);

		// Lazy creation: if no calendars exist, create a default one
		if (calendars.length === 0) {
			const defaultCalendar = await this.calendarService.getOrCreateDefaultCalendar(user.userId);
			calendars = [defaultCalendar];
		}

		return { calendars };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const calendar = await this.calendarService.findByIdOrThrow(id, user.userId);
		return { calendar };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateCalendarDto) {
		const calendar = await this.calendarService.create(user.userId, dto);
		return { calendar };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateCalendarDto
	) {
		const calendar = await this.calendarService.update(id, user.userId, dto);
		return { calendar };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.calendarService.delete(id, user.userId);
		return { success: true };
	}
}
