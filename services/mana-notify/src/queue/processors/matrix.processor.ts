import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { MATRIX_QUEUE } from '../queue.module';
import { MatrixService } from '../../channels/matrix/matrix.service';
import { MetricsService } from '../../metrics/metrics.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { notifications, deliveryLogs, type NewDeliveryLog } from '../../db/schema';

export interface MatrixJob {
	notificationId: string;
	roomId: string;
	body: string;
	formattedBody?: string;
	msgtype?: 'text' | 'notice';
	appId: string;
}

@Processor(MATRIX_QUEUE, {
	concurrency: 5,
})
export class MatrixProcessor extends WorkerHost {
	private readonly logger = new Logger(MatrixProcessor.name);

	constructor(
		private readonly matrixService: MatrixService,
		private readonly metricsService: MetricsService,
		@Inject(DATABASE_CONNECTION) private readonly db: any
	) {
		super();
	}

	async process(job: Job<MatrixJob>): Promise<void> {
		const { notificationId, roomId, body, formattedBody, msgtype, appId } = job.data;
		const startTime = Date.now();

		this.logger.debug(`Processing Matrix job ${job.id} to room ${roomId}`);

		// Update notification status to processing
		await this.updateNotificationStatus(notificationId, 'processing');

		const result = await this.matrixService.sendMessage({
			roomId,
			body,
			formattedBody,
			msgtype,
		});

		const durationMs = Date.now() - startTime;

		// Log the delivery attempt
		await this.logDelivery({
			notificationId,
			attemptNumber: job.attemptsMade + 1,
			channel: 'matrix',
			success: result.success,
			errorMessage: result.error,
			providerId: result.eventId,
			durationMs,
		});

		this.metricsService.recordMatrixSent(result.success);
		this.metricsService.recordNotificationLatency('matrix', durationMs / 1000);

		if (result.success) {
			this.metricsService.recordNotificationSent('matrix', appId);
			await this.updateNotificationStatus(notificationId, 'delivered', result.eventId);
			this.logger.log(`Matrix message sent to ${roomId} in ${durationMs}ms`);
		} else {
			this.metricsService.recordNotificationFailed('matrix', appId, 'send_error');
			// Only mark as failed if no more retries
			if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
				await this.updateNotificationStatus(notificationId, 'failed', undefined, result.error);
			}
			throw new Error(result.error || 'Failed to send Matrix message');
		}
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<MatrixJob>, error: Error) {
		this.logger.error(`Matrix job ${job.id} failed: ${error.message}`);
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
