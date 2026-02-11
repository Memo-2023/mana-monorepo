import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { CreditsModule } from './credits/credits.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SettingsModule } from './settings/settings.module';
import { TagsModule } from './tags/tags.module';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics';
import { AnalyticsModule } from './analytics';
import { AdminModule } from './admin/admin.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerModule } from './common/logger';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 60000, // 60 seconds
				limit: 100, // 100 requests per minute
			},
		]),
		LoggerModule,
		MetricsModule,
		AnalyticsModule,
		AiModule,
		AuthModule,
		CreditsModule,
		FeedbackModule,
		HealthModule,
		ReferralsModule,
		SettingsModule,
		TagsModule,
		AdminModule,
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
