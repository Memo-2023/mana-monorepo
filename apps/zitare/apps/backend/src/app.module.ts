import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { FavoriteModule } from './favorite/favorite.module';
import { ListModule } from './list/list.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		FavoriteModule,
		ListModule,
		HealthModule.forRoot({ serviceName: 'quote-backend' }),
		MetricsModule.register({
			prefix: 'zitare_',
			excludePaths: ['/health'],
		}),
		AdminModule,
	],
})
export class AppModule {}
