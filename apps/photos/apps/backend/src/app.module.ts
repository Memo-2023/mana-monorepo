import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManaCoreModule } from '@manacore/nestjs-integration';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { DatabaseModule } from './db/database.module';
import { AlbumModule } from './album/album.module';
import { FavoriteModule } from './favorite/favorite.module';
import { TagModule } from './tag/tag.module';
import { PhotoModule } from './photo/photo.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				appId: configService.get<string>('APP_ID', 'photos'),
				serviceKey: configService.get<string>('MANA_CORE_SERVICE_KEY', ''),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		HealthModule.forRoot({ serviceName: 'photos-backend' }),
		DatabaseModule,
		AlbumModule,
		FavoriteModule,
		TagModule,
		PhotoModule,
	],
})
export class AppModule {}
