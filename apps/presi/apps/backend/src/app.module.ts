import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { DatabaseModule } from './db/database.module';
import { DeckModule } from './deck/deck.module';
import { SlideModule } from './slide/slide.module';
import { ThemeModule } from './theme/theme.module';
import { ShareModule } from './share/share.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
		DatabaseModule,
		DeckModule,
		SlideModule,
		ThemeModule,
		ShareModule,
		AdminModule,
		HealthModule.forRoot({ serviceName: 'presi-backend' }),
		MetricsModule.register({
			prefix: 'presi_',
			excludePaths: ['/health'],
		}),
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
