import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ShareService } from './share.service';
import { CreateShareDto, UpdateShareDto } from './dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ShareController {
	constructor(private readonly shareService: ShareService) {}

	@Get('calendars/:calendarId/shares')
	async findByCalendar(
		@CurrentUser() user: CurrentUserData,
		@Param('calendarId') calendarId: string
	) {
		const shares = await this.shareService.findByCalendar(calendarId, user.userId);
		return { shares };
	}

	@Post('calendars/:calendarId/shares')
	async create(
		@CurrentUser() user: CurrentUserData,
		@Param('calendarId') calendarId: string,
		@Body() dto: Omit<CreateShareDto, 'calendarId'>
	) {
		const share = await this.shareService.create(user.userId, user.email, {
			...dto,
			calendarId,
		});
		return { share };
	}

	@Put('calendars/:calendarId/shares/:shareId')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('shareId') shareId: string,
		@Body() dto: UpdateShareDto
	) {
		const share = await this.shareService.update(shareId, user.userId, dto);
		return { share };
	}

	@Delete('calendars/:calendarId/shares/:shareId')
	async delete(@CurrentUser() user: CurrentUserData, @Param('shareId') shareId: string) {
		await this.shareService.delete(shareId, user.userId);
		return { success: true };
	}

	@Get('shares/invitations')
	async getInvitations(@CurrentUser() user: CurrentUserData) {
		const invitations = await this.shareService.findPendingInvitations(
			user.userId,
			user.email || ''
		);
		return { invitations };
	}

	@Post('shares/:shareId/accept')
	async acceptInvitation(@CurrentUser() user: CurrentUserData, @Param('shareId') shareId: string) {
		const share = await this.shareService.acceptInvitation(shareId, user.userId);
		return { share };
	}

	@Post('shares/:shareId/decline')
	async declineInvitation(@CurrentUser() user: CurrentUserData, @Param('shareId') shareId: string) {
		const share = await this.shareService.declineInvitation(shareId, user.userId);
		return { share };
	}

	@Get('shares/shared-with-me')
	async getSharedCalendars(@CurrentUser() user: CurrentUserData) {
		const shares = await this.shareService.getSharedCalendarsForUser(user.userId);
		return { shares };
	}
}
