import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	Query,
	Res,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { SyncService } from './sync.service';
import { ConnectCalendarDto, UpdateExternalCalendarDto, DiscoverCalDavDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class SyncController {
	constructor(private readonly syncService: SyncService) {}

	/**
	 * List all external calendars for the current user
	 */
	@Get('sync/external')
	async listExternalCalendars(@CurrentUser() user: CurrentUserData) {
		const calendars = await this.syncService.findByUser(user.userId);
		return { calendars };
	}

	/**
	 * Connect a new external calendar
	 */
	@Post('sync/external')
	async connectCalendar(@CurrentUser() user: CurrentUserData, @Body() dto: ConnectCalendarDto) {
		const calendar = await this.syncService.connect(user.userId, dto);
		return { calendar };
	}

	/**
	 * Get a specific external calendar
	 */
	@Get('sync/external/:id')
	async getExternalCalendar(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		const calendar = await this.syncService.findOne(id, user.userId);
		return { calendar };
	}

	/**
	 * Update external calendar settings
	 */
	@Put('sync/external/:id')
	async updateExternalCalendar(
		@CurrentUser() user: CurrentUserData,
		@Param('id') id: string,
		@Body() dto: UpdateExternalCalendarDto
	) {
		const calendar = await this.syncService.update(id, user.userId, dto);
		return { calendar };
	}

	/**
	 * Disconnect an external calendar
	 */
	@Delete('sync/external/:id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async disconnectCalendar(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		await this.syncService.disconnect(id, user.userId);
	}

	/**
	 * Trigger manual sync for an external calendar
	 */
	@Post('sync/external/:id/sync')
	async triggerSync(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
		// Verify ownership
		await this.syncService.findOne(id, user.userId);

		const result = await this.syncService.syncCalendar(id);
		return {
			success: result.success,
			eventsImported: result.eventsImported,
			eventsExported: result.eventsExported,
			errors: result.errors,
		};
	}

	/**
	 * Discover CalDAV calendars on a server
	 */
	@Post('sync/caldav/discover')
	async discoverCalDav(@Body() dto: DiscoverCalDavDto) {
		return this.syncService.discoverCalDav(dto);
	}

	/**
	 * Get Google OAuth authorization URL
	 */
	@Get('sync/google/auth-url')
	async getGoogleAuthUrl(@Query('state') state?: string) {
		const url = this.syncService.getGoogleAuthUrl(state);
		return { url };
	}

	/**
	 * Handle Google OAuth callback
	 */
	@Get('sync/google/callback')
	async handleGoogleCallback(
		@CurrentUser() user: CurrentUserData,
		@Query('code') code: string,
		@Query('state') state?: string
	) {
		const result = await this.syncService.handleGoogleCallback(code, user.userId);
		return {
			...result,
			state,
		};
	}

	/**
	 * Export a local calendar as iCal file
	 */
	@Get('calendars/:calendarId/export.ics')
	async exportCalendar(
		@CurrentUser() user: CurrentUserData,
		@Param('calendarId') calendarId: string,
		@Res() res: Response
	) {
		const icalData = await this.syncService.exportCalendarAsIcal(calendarId, user.userId);

		res.set({
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="calendar-${calendarId}.ics"`,
		});
		res.send(icalData);
	}
}
