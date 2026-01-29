import { Module } from '@nestjs/common';
import { CrawlerController } from './crawler.controller';
import { CrawlerService } from './crawler.service';
import { QueueModule } from '../queue/queue.module';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
	imports: [QueueModule, MetricsModule],
	controllers: [CrawlerController],
	providers: [CrawlerService],
	exports: [CrawlerService],
})
export class CrawlerModule {}
