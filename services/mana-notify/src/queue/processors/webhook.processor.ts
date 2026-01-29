import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { WEBHOOK_QUEUE } from '../queue-names';
import { WebhookService } from '../../channels/webhook/webhook.service';
import { MetricsService } from '../../metrics/metrics.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { notifications, deliveryLogs, type NewDeliveryLog } from '../../db/schema';

export interface WebhookJob {
	notificationId: string;
	url: string;
	method?: 'POST' | 'PUT';
	headers?: Record<string, string>;
	body: Record<string, unknown>;
	timeout?: number;
	appId: string;
}

@Processor(WEBHOOK_QUEUE, {
	concurrency: 10,
})
export class WebhookProcessor extends WorkerHost {
	private readonly logger = new Logger(WebhookProcessor.name);

	constructor(
		private readonly webhookService: WebhookService,
		private readonly metricsService: MetricsService,
		@Inject(DATABASE_CONNECTION) private readonly db: any
	) {
		super();
	}

	async process(job: Job<WebhookJob>): Promise<void> {
		const { notificationId, url, method, headers, body, timeout, appId } = job.data;
		const startTime = Date.now();

		this.logger.debug(`Processing webhook job ${job.id} to ${url}`);

		// Update notification status to processing
		await this.updateNotificationStatus(notificationId, 'processing');

		const result = await this.webhookService.send({
			url,
			method,
			headers,
			body,
			timeout,
		});

		const durationMs = Date.now() - startTime;

		// Log the delivery attempt
		await this.logDelivery({
			notificationId,
			attemptNumber: job.attemptsMade + 1,
			channel: 'webhook',
			success: result.success,
			statusCode: result.statusCode,
			errorMessage: result.error,
			durationMs: result.durationMs,
		});

		this.metricsService.recordWebhookSent(result.success);
		this.metricsService.recordNotificationLatency('webhook', durationMs / 1000);

		if (result.success) {
			this.metricsService.recordNotificationSent('webhook', appId);
			await this.updateNotificationStatus(notificationId, 'delivered');
			this.logger.log(`Webhook sent to ${url} in ${durationMs}ms`);
		} else {
			this.metricsService.recordNotificationFailed('webhook', appId, 'send_error');
			// Only mark as failed if no more retries
			if (job.attemptsMade >= (job.opts.attempts || 5) - 1) {
				await this.updateNotificationStatus(notificationId, 'failed', undefined, result.error);
			}
			throw new Error(result.error || 'Failed to send webhook');
		}
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<WebhookJob>, error: Error) {
		this.logger.error(`Webhook job ${job.id} failed: ${error.message}`);
	}

	private async updateNotificationStatus(
		notificationId: string,
		status: string,
		providerId?: string,
		errorMessage?: string
	): Promise<void> {
		try {
			const updateData: Record<string, unknown> = {
				status,
				updatedAt: new Date(),
			};

			if (status === 'delivered') {
				updateData.deliveredAt = new Date();
			}

			if (errorMessage) {
				updateData.errorMessage = errorMessage;
			}

			await this.db
				.update(notifications)
				.set(updateData)
				.where(eq(notifications.id, notificationId));
		} catch (error) {
			this.logger.error(`Failed to update notification status: ${error}`);
		}
	}

	private async logDelivery(log: Omit<NewDeliveryLog, 'id' | 'createdAt'>): Promise<void> {
		try {
			await this.db.insert(deliveryLogs).values(log);
		} catch (error) {
			this.logger.error(`Failed to log delivery: ${error}`);
		}
	}
}
