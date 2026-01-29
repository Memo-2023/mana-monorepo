import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import configuration from './config/configuration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { CacheModule } from './cache/cache.module';
import { CrawlerModule } from './crawler/crawler.module';
import { QueueModule } from './queue/queue.module';
import { ProcessorModule } from './queue/processor.module';
import { ParserModule } from './parser/parser.module';
import { RobotsModule } from './robots/robots.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BullModule.forRootAsync({
			useFactory: () => ({
				connection: {
					host: process.env.REDIS_HOST || 'localhost',
					port: parseInt(process.env.REDIS_PORT || '6379', 10),
					password: process.env.REDIS_PASSWORD || undefined,
				},
			}),
		}),
		BullBoardModule.forRoot({
			route: '/queue/dashboard',
			adapter: ExpressAdapter,
		}),
		DatabaseModule,
		HealthModule,
		MetricsModule,
		CacheModule,
		RobotsModule,
		ParserModule,
		QueueModule,
		ProcessorModule,
		CrawlerModule,
	],
})
export class AppModule {}
