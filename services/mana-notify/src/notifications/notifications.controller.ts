import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	HttpCode,
	HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ServiceAuthGuard } from '../common/guards/service-auth.guard';
import {
	SendNotificationDto,
	ScheduleNotificationDto,
	BatchNotificationDto,
	NotificationResponse,
	BatchNotificationResponse,
} from './dto/send-notification.dto';
import { Notification } from '../db/schema';

@Controller('notifications')
@UseGuards(ServiceAuthGuard)
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Post('send')
	async send(@Body() dto: SendNotificationDto): Promise<{ notification: NotificationResponse }> {
		const notification = await this.notificationsService.send(dto);
		return { notification };
	}

	@Post('schedule')
	async schedule(
		@Body() dto: ScheduleNotificationDto
	): Promise<{ notification: NotificationResponse }> {
		const notification = await this.notificationsService.schedule(dto);
		return { notification };
	}

	@Post('batch')
	async batch(@Body() dto: BatchNotificationDto): Promise<BatchNotificationResponse> {
		const results = await this.notificationsService.sendBatch(dto.notifications);

		const succeeded = results.filter((r) => r.status !== 'failed').length;
		const failed = results.length - succeeded;

		return {
			results,
			succeeded,
			failed,
		};
	}

	@Get(':id')
	async getById(@Param('id') id: string): Promise<{ notification: Notification | null }> {
		const notification = await this.notificationsService.getById(id);
		return { notification };
	}

	@Delete(':id')
	@HttpCode(HttpStatus.OK)
	async cancel(@Param('id') id: string): Promise<{ notification: Notification }> {
		const notification = await this.notificationsService.cancel(id);
		return { notification };
	}
}
