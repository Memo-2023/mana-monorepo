import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
	imports: [MetricsModule],
	providers: [CacheService],
	exports: [CacheService],
})
export class CacheModule {}
