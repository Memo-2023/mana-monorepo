import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailProcessor } from './processors/email.processor';
import { PushProcessor } from './processors/push.processor';
import { MatrixProcessor } from './processors/matrix.processor';
import { WebhookProcessor } from './processors/webhook.processor';
import { ChannelsModule } from '../channels/channels.module';
import { MetricsModule } from '../metrics/metrics.module';
import { EMAIL_QUEUE, PUSH_QUEUE, MATRIX_QUEUE, WEBHOOK_QUEUE } from './queue-names';

// Re-export for convenience
export { EMAIL_QUEUE, PUSH_QUEUE, MATRIX_QUEUE, WEBHOOK_QUEUE } from './queue-names';

@Module({
	imports: [
		BullModule.registerQueue(
			{
				name: EMAIL_QUEUE,
				defaultJobOptions: {
					attempts: 3,
					backoff: {
						type: 'exponential',
						delay: 5000,
					},
					removeOnComplete: 100,
					removeOnFail: 1000,
				},
			},
			{
				name: PUSH_QUEUE,
				defaultJobOptions: {
					attempts: 3,
					backoff: {
						type: 'exponential',
						delay: 1000,
					},
					removeOnComplete: 100,
					removeOnFail: 1000,
				},
			},
			{
				name: MATRIX_QUEUE,
				defaultJobOptions: {
					attempts: 3,
					backoff: {
						type: 'exponential',
						delay: 2000,
					},
					removeOnComplete: 100,
					removeOnFail: 500,
				},
			},
			{
				name: WEBHOOK_QUEUE,
				defaultJobOptions: {
					attempts: 5,
					backoff: {
						type: 'exponential',
						delay: 3000,
					},
					removeOnComplete: 100,
					removeOnFail: 1000,
				},
			}
		),
		ChannelsModule,
		MetricsModule,
	],
	providers: [EmailProcessor, PushProcessor, MatrixProcessor, WebhookProcessor],
	exports: [BullModule],
})
export class QueueModule {}
