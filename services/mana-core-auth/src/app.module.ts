import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { CreditsModule } from './credits/credits.module';
import { EmailModule } from './email/email.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ReferralsModule } from './referrals/referrals.module';
import { SecurityModule } from './security/security.module';
import { SettingsModule } from './settings/settings.module';
import { TagsModule } from './tags/tags.module';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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
		AiModule,
		AuthModule,
		CreditsModule,
		EmailModule,
		FeedbackModule,
		HealthModule,
		ReferralsModule,
		SecurityModule,
		SettingsModule,
		TagsModule,
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
