import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { DatabaseModule } from './db/database.module';
import { AlbumModule } from './album/album.module';
import { FavoriteModule } from './favorite/favorite.module';
import { TagModule } from './tag/tag.module';
import { PhotoModule } from './photo/photo.module';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		HealthModule.forRoot({ serviceName: 'photos-backend' }),
		MetricsModule.register({
			prefix: 'photos_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		AlbumModule,
		FavoriteModule,
		TagModule,
		PhotoModule,
		AdminModule,
	],
})
export class AppModule {}
