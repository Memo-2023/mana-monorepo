import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import { LlmModule } from '@manacore/shared-llm';
import configuration from './config/configuration';
import { AdminModule } from './admin/admin.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuthModule } from './auth/auth.module';
import { GuildsModule } from './guilds/guilds.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
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
		AdminModule,
		ApiKeysModule,
		AuthModule,
		GuildsModule,
		HealthModule,
		MeModule,
	],
	providers: [
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
