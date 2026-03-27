import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import { LlmModule } from '@manacore/shared-llm';
import configuration from './config/configuration';
import { AdminModule } from './admin/admin.module';
import { AiModule } from './ai/ai.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';
import { CreditsModule } from './credits/credits.module';
import { FeedbackModule } from './feedback/feedback.module';
import { GiftsModule } from './gifts/gifts.module';
import { GuildsModule } from './guilds/guilds.module';
import { HealthModule } from './health/health.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';
import { TagGroupsModule } from './tag-groups/tag-groups.module';
import { TagLinksModule } from './tag-links/tag-links.module';
import { TagsModule } from './tags/tags.module';
import { MeModule } from './me/me.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { StripeModule } from './stripe/stripe.module';
import { AnalyticsModule } from './analytics';
import { MetricsModule } from './metrics';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerModule } from './common/logger';
import { SecurityModule } from './security';

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
		LlmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				manaLlmUrl: config.get('MANA_LLM_URL'),
				debug: config.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		LoggerModule,
		SecurityModule,
		MetricsModule,
		AnalyticsModule,
		AdminModule,
		AiModule,
		ApiKeysModule,
		AuthModule,
		CreditsModule,
		FeedbackModule,
		GiftsModule,
		GuildsModule,
		HealthModule,
		SettingsModule,
		StorageModule,
		TagsModule,
		TagGroupsModule,
		TagLinksModule,
		MeModule,
		StripeModule,
		SubscriptionsModule,
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
