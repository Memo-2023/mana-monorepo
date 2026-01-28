import { Controller, Post, Delete, Body, Param, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { NotificationService } from './notification.service';
import { RegisterTokenDto } from './dto';

@Controller('api/v1/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
	constructor(private notificationService: NotificationService) {}

	/**
	 * Register a push token for the current user
	 */
	@Post('register-token')
	async registerToken(@CurrentUser() user: CurrentUserData, @Body() dto: RegisterTokenDto) {
		const token = await this.notificationService.registerToken(user.userId, dto);
		return {
			success: true,
			token: {
				id: token.id,
				platform: token.platform,
				deviceName: token.deviceName,
				createdAt: token.createdAt,
			},
		};
	}

	/**
	 * Remove a push token
	 */
	@Delete('token/:token')
	async removeToken(@CurrentUser() user: CurrentUserData, @Param('token') token: string) {
		await this.notificationService.removeToken(decodeURIComponent(token));
		return { success: true };
	}

	/**
	 * Get the number of registered devices for the current user
	 */
	@Get('devices/count')
	async getDeviceCount(@CurrentUser() user: CurrentUserData) {
		const count = await this.notificationService.getTokenCount(user.userId);
		return { count };
	}
}
