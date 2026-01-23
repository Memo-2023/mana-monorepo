import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TelegrafModule } from 'nestjs-telegraf';
import configuration from './config/configuration';
import { BotModule } from './bot/bot.module';
import { UmamiModule } from './umami/umami.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HealthController } from './health.controller';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		ScheduleModule.forRoot(),
		TelegrafModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				token: configService.get<string>('telegram.botToken') || '',
				launchOptions: {
					dropPendingUpdates: true,
				},
			}),
			inject: [ConfigService],
		}),
		BotModule,
		UmamiModule,
		AnalyticsModule,
		SchedulerModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
