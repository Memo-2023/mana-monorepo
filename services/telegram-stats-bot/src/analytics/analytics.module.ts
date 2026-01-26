import { Module } from '@nestjs/common';
import { UmamiModule } from '../umami/umami.module';
import { UsersModule } from '../users/users.module';
import { AnalyticsService } from './analytics.service';

@Module({
	imports: [UmamiModule, UsersModule],
	providers: [AnalyticsService],
	exports: [AnalyticsService],
})
export class AnalyticsModule {}
