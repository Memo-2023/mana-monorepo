import { Module, forwardRef } from '@nestjs/common';
import { CrawlProcessor } from './processors/crawl.processor';
import { ParserModule } from '../parser/parser.module';
import { RobotsModule } from '../robots/robots.module';
import { CacheModule } from '../cache/cache.module';
import { MetricsModule } from '../metrics/metrics.module';
import { QueueModule } from './queue.module';
import { CRAWL_QUEUE } from './constants';

@Module({
	imports: [
		forwardRef(() => QueueModule),
		ParserModule,
		RobotsModule,
		CacheModule,
		MetricsModule,
	],
	providers: [CrawlProcessor],
})
export class ProcessorModule {}
