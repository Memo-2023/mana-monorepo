import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UsersModule } from '../users/users.module';

@Module({
	imports: [AnalyticsModule, UsersModule],
	providers: [MatrixService],
	exports: [MatrixService],
})
export class BotModule {}
