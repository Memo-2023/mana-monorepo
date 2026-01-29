import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ProxyController } from './proxy.controller';
import { SearchProxyService, SttProxyService, TtsProxyService } from './services';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { UsageModule } from '../usage/usage.module';
import { CreditsModule } from '../credits/credits.module';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { RateLimitGuard, REDIS_CLIENT } from '../guards/rate-limit.guard';
import { CreditsGuard } from '../guards/credits.guard';
import { UsageTrackingInterceptor } from '../common/interceptors/usage-tracking.interceptor';

@Module({
	imports: [
		MulterModule.register({
			storage: memoryStorage(),
			limits: {
				fileSize: 100 * 1024 * 1024, // 100MB max file size
			},
		}),
		ApiKeysModule,
		UsageModule,
		CreditsModule,
	],
	controllers: [ProxyController],
	providers: [
		SearchProxyService,
		SttProxyService,
		TtsProxyService,
		ApiKeyGuard,
		RateLimitGuard,
		CreditsGuard,
		UsageTrackingInterceptor,
		{
			provide: REDIS_CLIENT,
			useFactory: (configService: ConfigService) => {
				const host = configService.get<string>('redis.host') || 'localhost';
				const port = configService.get<number>('redis.port') || 6379;
				const password = configService.get<string>('redis.password');

				return new Redis({
					host,
					port,
					password: password || undefined,
					keyPrefix: configService.get<string>('redis.keyPrefix') || 'api-gateway:',
				});
			},
			inject: [ConfigService],
		},
	],
	exports: [REDIS_CLIENT],
})
export class ProxyModule {}
