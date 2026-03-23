import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { LocationModule } from './location/location.module';
import { FavoriteModule } from './favorite/favorite.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		LocationModule,
		FavoriteModule,
		HealthModule.forRoot({ serviceName: 'citycorners-backend' }),
		MetricsModule.register({
			prefix: 'citycorners_',
			excludePaths: ['/health'],
		}),
	],
})
export class AppModule {}
