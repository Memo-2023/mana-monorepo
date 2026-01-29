import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { PUSH_QUEUE } from '../queue.module';
import { PushService } from '../../channels/push/push.service';
import { MetricsService } from '../../metrics/metrics.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { notifications, deliveryLogs, type NewDeliveryLog } from '../../db/schema';

export interface PushJob {
	notificationId: string;
	tokens: string[];
	title: string;
	body: string;
	data?: Record<string, unknown>;
	sound?: 'default' | null;
	badge?: number;
	platform: string;
	appId: string;
}

@Processor(PUSH_QUEUE, {
	concurrency: 10,
})
export class PushProcessor extends WorkerHost {
	private readonly logger = new Logger(PushProcessor.name);

	constructor(
		private readonly pushService: PushService,
		private readonly metricsService: MetricsService,
		@Inject(DATABASE_CONNECTION) private readonly db: any
	) {
		super();
	}

	async process(job: Job<PushJob>): Promise<void> {
		const { notificationId, tokens, title, body, data, sound, badge, platform, appId } = job.data;
		const startTime = Date.now();

		this.logger.debug(`Processing push job ${job.id} to ${tokens.length} tokens`);

		// Update notification status to processing
		await this.updateNotificationStatus(notificationId, 'processing');

		const results = await this.pushService.sendToTokens(tokens, {
			title,
			body,
			data,
			sound,
			badge,
		});

		const durationMs = Date.now() - startTime;

		// Count successes and failures
		let successCount = 0;
		let failCount = 0;
		const ticketIds: string[] = [];

		for (const [token, result] of results) {
			if (result.success) {
				successCount++;
				if (result.ticketId) {
					ticketIds.push(result.ticketId);
				}
			} else {
				failCount++;
			}

			// Record per-token metrics
			this.metricsService.recordPushSent(platform, result.success);
		}

		// Log the delivery attempt
		await this.logDelivery({
			notificationId,
			attemptNumber: job.attemptsMade + 1,
			channel: 'push',
			success: successCount > 0,
			errorMessage: failCount > 0 ? `${failCount}/${tokens.length} tokens failed` : undefined,
			providerId: ticketIds.join(','),
			durationMs,
		});

		this.metricsService.recordPushLatency(durationMs / 1000);

		if (successCount > 0) {
			this.metricsService.recordNotificationSent('push', appId);
			await this.updateNotificationStatus(
				notificationId,
				failCount === 0 ? 'delivered' : 'delivered', // Partial success still counts as delivered
				ticketIds.join(',')
			);
			this.logger.log(
				`Push notification sent: ${successCount}/${tokens.length} successful in ${durationMs}ms`
			);
		} else {
			this.metricsService.recordNotificationFailed('push', appId, 'send_error');
			// Only mark as failed if no more retries
			if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
				await this.updateNotificationStatus(
					notificationId,
					'failed',
					undefined,
					'All tokens failed'
				);
			}
			throw new Error('All push tokens failed');
		}
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<PushJob>, error: Error) {
		this.logger.error(`Push job ${job.id} failed: ${error.message}`);
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
