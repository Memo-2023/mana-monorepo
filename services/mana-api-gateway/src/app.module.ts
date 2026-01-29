import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { UsageModule } from './usage/usage.module';
import { ProxyModule } from './proxy/proxy.module';
import { CreditsModule } from './credits/credits.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		DatabaseModule,
		HealthModule,
		ApiKeysModule,
		UsageModule,
		ProxyModule,
		CreditsModule,
		MetricsModule,
	],
})
export class AppModule {}
