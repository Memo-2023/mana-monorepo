import { Module } from '@nestjs/common';
import { UmamiModule } from '../umami/umami.module';
import { AnalyticsService } from './analytics.service';

@Module({
	imports: [UmamiModule],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
