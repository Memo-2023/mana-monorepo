import { Injectable, Logger, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { notifications, type Notification, type NewNotification } from '../db/schema';
import { EMAIL_QUEUE, PUSH_QUEUE, MATRIX_QUEUE, WEBHOOK_QUEUE } from '../queue/queue.module';
import { TemplatesService } from '../templates/templates.service';
import { DevicesService } from '../devices/devices.service';
import { PreferencesService } from '../preferences/preferences.service';
import {
	SendNotificationDto,
	ScheduleNotificationDto,
	NotificationResponse,
	NotificationChannel,
} from './dto/send-notification.dto';
import { EmailJob } from '../queue/processors/email.processor';
import { PushJob } from '../queue/processors/push.processor';
import { MatrixJob } from '../queue/processors/matrix.processor';
import { WebhookJob } from '../queue/processors/webhook.processor';

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private readonly db: any,
		@InjectQueue(EMAIL_QUEUE) private readonly emailQueue: Queue,
		@InjectQueue(PUSH_QUEUE) private readonly pushQueue: Queue,
		@InjectQueue(MATRIX_QUEUE) private readonly matrixQueue: Queue,
		@InjectQueue(WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
		private readonly templatesService: TemplatesService,
		private readonly devicesService: DevicesService,
		private readonly preferencesService: PreferencesService
	) {}

	async send(dto: SendNotificationDto): Promise<NotificationResponse> {
		// Check for idempotency
		if (dto.externalId) {
			const existing = await this.findByExternalId(dto.externalId);
			if (existing) {
				return this.toResponse(existing);
			}
		}

		// Check user preferences if userId is provided
		if (dto.userId) {
			const allowed = await this.checkPreferences(dto.userId, dto.channel, dto.appId);
			if (!allowed) {
				this.logger.debug(`Notification blocked by user preferences: ${dto.userId}`);
				// Still create the notification but mark as cancelled
				const notification = await this.createNotification({
					...this.dtoToNotification(dto),
					status: 'cancelled',
					errorMessage: 'Blocked by user preferences',
				});
				return this.toResponse(notification);
			}
		}

		// Render template if specified
		let subject = dto.subject;
		let body = dto.body;

		if (dto.template) {
			const rendered = await this.templatesService.renderBySlug(dto.template, dto.data || {});
			if (rendered) {
				subject = subject || rendered.subject;
				body = body || rendered.body;
			} else {
				this.logger.warn(`Template not found: ${dto.template}`);
			}
		}

		if (!body && dto.channel !== NotificationChannel.WEBHOOK) {
			throw new BadRequestException('Either template or body must be provided');
		}

		// Create notification record
		const notification = await this.createNotification({
			...this.dtoToNotification(dto),
			subject,
			body,
		});

		// Queue the notification based on channel
		await this.queueNotification(notification, dto);

		return this.toResponse(notification);
	}

	async schedule(dto: ScheduleNotificationDto): Promise<NotificationResponse> {
		const scheduledFor = new Date(dto.scheduledFor);

		if (scheduledFor <= new Date()) {
			throw new BadRequestException('scheduledFor must be in the future');
		}

		// Render template if specified
		let subject = dto.subject;
		let body = dto.body;

		if (dto.template) {
			const rendered = await this.templatesService.renderBySlug(dto.template, dto.data || {});
			if (rendered) {
				subject = subject || rendered.subject;
				body = body || rendered.body;
			}
		}

		// Create notification record with scheduled status
		const notification = await this.createNotification({
			...this.dtoToNotification(dto),
			subject,
			body,
			scheduledFor,
			status: 'pending',
		});

		// Queue with delay
		const delay = scheduledFor.getTime() - Date.now();
		await this.queueNotification(notification, dto, delay);

		return this.toResponse(notification);
	}

	async sendBatch(dtos: SendNotificationDto[]): Promise<NotificationResponse[]> {
		const results: NotificationResponse[] = [];

		for (const dto of dtos) {
			try {
				const result = await this.send(dto);
				results.push(result);
			} catch (error) {
				this.logger.error(`Batch notification failed: ${error}`);
				// Create a failed notification record
				const notification = await this.createNotification({
					...this.dtoToNotification(dto),
					status: 'failed',
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
				});
				results.push(this.toResponse(notification));
			}
		}

		return results;
	}

	async getById(id: string): Promise<Notification | null> {
		const [notification] = await this.db
			.select()
			.from(notifications)
			.where(eq(notifications.id, id))
			.limit(1);

		return notification || null;
	}

	async cancel(id: string): Promise<Notification> {
		const notification = await this.getById(id);
		if (!notification) {
			throw new NotFoundException(`Notification ${id} not found`);
		}

		if (notification.status !== 'pending') {
			throw new BadRequestException('Can only cancel pending notifications');
		}

		const [updated] = await this.db
			.update(notifications)
			.set({ status: 'cancelled', updatedAt: new Date() })
			.where(eq(notifications.id, id))
			.returning();

		return updated;
	}

	async listByUser(userId: string, limit: number = 50): Promise<Notification[]> {
		return this.db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, userId))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);
	}

	private async createNotification(data: NewNotification): Promise<Notification> {
		const [notification] = await this.db.insert(notifications).values(data).returning();
		return notification;
	}

	private async findByExternalId(externalId: string): Promise<Notification | null> {
		const [notification] = await this.db
			.select()
			.from(notifications)
			.where(eq(notifications.externalId, externalId))
			.limit(1);

		return notification || null;
	}

	private async checkPreferences(
		userId: string,
		channel: NotificationChannel,
		appId: string
	): Promise<boolean> {
		const prefs = await this.preferencesService.getByUserId(userId);
		if (!prefs) {
			return true; // No preferences = allow all
		}

		// Check global channel settings
		if (channel === NotificationChannel.EMAIL && !prefs.emailEnabled) {
			return false;
		}
		if (channel === NotificationChannel.PUSH && !prefs.pushEnabled) {
			return false;
		}

		// Check quiet hours
		if (prefs.quietHoursEnabled && this.isInQuietHours(prefs)) {
			return false;
		}

		return true;
	}

	private isInQuietHours(prefs: {
		quietHoursStart?: string | null;
		quietHoursEnd?: string | null;
		timezone?: string;
	}): boolean {
		if (!prefs.quietHoursStart || !prefs.quietHoursEnd) {
			return false;
		}

		const now = new Date();
		const [startHour, startMin] = prefs.quietHoursStart.split(':').map(Number);
		const [endHour, endMin] = prefs.quietHoursEnd.split(':').map(Number);

		const currentHour = now.getHours();
		const currentMin = now.getMinutes();
		const currentTime = currentHour * 60 + currentMin;
		const startTime = startHour * 60 + startMin;
		const endTime = endHour * 60 + endMin;

		if (startTime <= endTime) {
			return currentTime >= startTime && currentTime < endTime;
		} else {
			// Quiet hours span midnight
			return currentTime >= startTime || currentTime < endTime;
		}
	}

	private dtoToNotification(dto: SendNotificationDto): NewNotification {
		return {
			userId: dto.userId,
			appId: dto.appId,
			channel: dto.channel,
			templateId: dto.template,
			subject: dto.subject,
			body: dto.body,
			data: dto.data,
			recipient: dto.recipient,
			externalId: dto.externalId,
			priority: dto.priority || 'normal',
			status: 'pending',
		};
	}

	private async queueNotification(
		notification: Notification,
		dto: SendNotificationDto,
		delay?: number
	): Promise<void> {
		const jobOptions = delay ? { delay } : undefined;

		switch (dto.channel) {
			case NotificationChannel.EMAIL:
				await this.queueEmail(notification, dto, jobOptions);
				break;
			case NotificationChannel.PUSH:
				await this.queuePush(notification, dto, jobOptions);
				break;
			case NotificationChannel.MATRIX:
				await this.queueMatrix(notification, dto, jobOptions);
				break;
			case NotificationChannel.WEBHOOK:
				await this.queueWebhook(notification, dto, jobOptions);
				break;
		}
	}

	private async queueEmail(
		notification: Notification,
		dto: SendNotificationDto,
		jobOptions?: { delay: number }
	): Promise<void> {
		if (!dto.recipient) {
			throw new BadRequestException('Email recipient is required');
		}

		const job: EmailJob = {
			notificationId: notification.id,
			to: dto.recipient,
			subject: notification.subject || '',
			html: notification.body || '',
			from: dto.emailOptions?.from,
			template: dto.template,
			appId: dto.appId,
		};

		await this.emailQueue.add('send', job, jobOptions);
	}

	private async queuePush(
		notification: Notification,
		dto: SendNotificationDto,
		jobOptions?: { delay: number }
	): Promise<void> {
		let tokens: string[] = [];

		if (dto.recipients?.length) {
			tokens = dto.recipients;
		} else if (dto.recipient) {
			tokens = [dto.recipient];
		} else if (dto.userId) {
			// Get all device tokens for user
			const devices = await this.devicesService.getActiveDevicesByUser(dto.userId);
			tokens = devices.map((d) => d.pushToken);
		}

		if (tokens.length === 0) {
			throw new BadRequestException('No push tokens found');
		}

		const job: PushJob = {
			notificationId: notification.id,
			tokens,
			title: notification.subject || '',
			body: notification.body || '',
			data: dto.data,
			sound: dto.pushOptions?.sound,
			badge: dto.pushOptions?.badge,
			platform: 'mixed',
			appId: dto.appId,
		};

		await this.pushQueue.add('send', job, jobOptions);
	}

	private async queueMatrix(
		notification: Notification,
		dto: SendNotificationDto,
		jobOptions?: { delay: number }
	): Promise<void> {
		if (!dto.recipient) {
			throw new BadRequestException('Matrix room ID is required');
		}

		const job: MatrixJob = {
			notificationId: notification.id,
			roomId: dto.recipient,
			body: notification.body || '',
			formattedBody: dto.matrixOptions?.formattedBody,
			msgtype: dto.matrixOptions?.msgtype,
			appId: dto.appId,
		};

		await this.matrixQueue.add('send', job, jobOptions);
	}

	private async queueWebhook(
		notification: Notification,
		dto: SendNotificationDto,
		jobOptions?: { delay: number }
	): Promise<void> {
		if (!dto.recipient) {
			throw new BadRequestException('Webhook URL is required');
		}

		const job: WebhookJob = {
			notificationId: notification.id,
			url: dto.recipient,
			method: dto.webhookOptions?.method || 'POST',
			headers: dto.webhookOptions?.headers,
			body: dto.data || {},
			timeout: dto.webhookOptions?.timeout,
			appId: dto.appId,
		};

		await this.webhookQueue.add('send', job, jobOptions);
	}

	private toResponse(notification: Notification): NotificationResponse {
		return {
			id: notification.id,
			status: notification.status,
			channel: notification.channel,
			createdAt: notification.createdAt,
		};
	}
}
