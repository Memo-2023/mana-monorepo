import { Module } from '@nestjs/common';
import { AnalyticsModule } from '../analytics/analytics.module';
import { UsersModule } from '../users/users.module';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';

@Module({
	imports: [AnalyticsModule, UsersModule],
	providers: [BotService, BotUpdate],
	exports: [BotService],
})
export class BotModule {}
