import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { UmamiModule } from '../umami/umami.module';

@Module({
	imports: [UmamiModule],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
