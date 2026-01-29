import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { QueueService } from './queue.service';
import { CRAWL_QUEUE } from './constants';

// Re-export for convenience
export { CRAWL_QUEUE } from './constants';

@Module({
	imports: [
		BullModule.registerQueue({
			name: CRAWL_QUEUE,
			defaultJobOptions: {
				attempts: 3,
				backoff: {
					type: 'exponential',
					delay: 1000,
				},
				removeOnComplete: 100,
				removeOnFail: 1000,
			},
		}),
		BullBoardModule.forFeature({
			name: CRAWL_QUEUE,
			adapter: BullMQAdapter,
		}),
	],
	providers: [QueueService],
	exports: [QueueService, BullModule],
})
export class QueueModule {}
