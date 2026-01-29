import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { EMAIL_QUEUE } from '../queue.module';
import { EmailService } from '../../channels/email/email.service';
import { MetricsService } from '../../metrics/metrics.service';
import { DATABASE_CONNECTION } from '../../db/database.module';
import { notifications, deliveryLogs, type NewDeliveryLog } from '../../db/schema';

export interface EmailJob {
	notificationId: string;
	to: string;
	subject: string;
	html: string;
	text?: string;
	from?: string;
	template?: string;
	appId: string;
}

@Processor(EMAIL_QUEUE, {
	concurrency: 5,
})
export class EmailProcessor extends WorkerHost {
	private readonly logger = new Logger(EmailProcessor.name);

	constructor(
		private readonly emailService: EmailService,
		private readonly metricsService: MetricsService,
		@Inject(DATABASE_CONNECTION) private readonly db: any
	) {
		super();
	}

	async process(job: Job<EmailJob>): Promise<void> {
		const { notificationId, to, subject, html, text, from, template, appId } = job.data;
		const startTime = Date.now();

		this.logger.debug(`Processing email job ${job.id} to ${to}`);

		// Update notification status to processing
		await this.updateNotificationStatus(notificationId, 'processing');

		const result = await this.emailService.sendEmail({
			to,
			subject,
			html,
			text,
			from,
		});

		const durationMs = Date.now() - startTime;

		// Log the delivery attempt
		await this.logDelivery({
			notificationId,
			attemptNumber: job.attemptsMade + 1,
			channel: 'email',
			success: result.success,
			errorMessage: result.error,
			providerId: result.messageId,
			durationMs,
		});

		// Record metrics
		this.metricsService.recordEmailSent(template || 'custom', result.success);
		this.metricsService.recordEmailLatency(durationMs / 1000);

		if (result.success) {
			this.metricsService.recordNotificationSent('email', appId);
			await this.updateNotificationStatus(notificationId, 'delivered', result.messageId);
			this.logger.log(`Email sent successfully to ${to} in ${durationMs}ms`);
		} else {
			this.metricsService.recordNotificationFailed('email', appId, 'send_error');
			// Only mark as failed if no more retries
			if (job.attemptsMade >= (job.opts.attempts || 3) - 1) {
				await this.updateNotificationStatus(notificationId, 'failed', undefined, result.error);
			}
			throw new Error(result.error || 'Failed to send email');
		}
	}

	@OnWorkerEvent('failed')
	onFailed(job: Job<EmailJob>, error: Error) {
		this.logger.error(`Email job ${job.id} failed: ${error.message}`);
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
