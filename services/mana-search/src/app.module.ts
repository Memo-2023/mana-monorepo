import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { CacheModule } from './cache/cache.module';
import { SearchModule } from './search/search.module';
import { ExtractModule } from './extract/extract.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		HealthModule,
		MetricsModule,
		CacheModule,
		SearchModule,
		ExtractModule,
	],
})
export class AppModule {}
