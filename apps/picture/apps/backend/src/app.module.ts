import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ManaCoreModule } from '@manacore/nestjs-integration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { ModelModule } from './model/model.module';
import { TagModule } from './tag/tag.module';
import { ImageModule } from './image/image.module';
import { BoardModule } from './board/board.module';
import { BoardItemModule } from './board-item/board-item.module';
import { UploadModule } from './upload/upload.module';
import { GenerateModule } from './generate/generate.module';
import { ExploreModule } from './explore/explore.module';
import { ProfileModule } from './profile/profile.module';
import { BatchModule } from './batch/batch.module';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				appId: configService.get('APP_ID', 'picture-app'),
				serviceKey: configService.get('MANA_CORE_SERVICE_KEY', ''),
				authUrl: configService.get('MANA_CORE_AUTH_URL', 'http://localhost:3001'),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'picture-backend' }),
		ModelModule,
		TagModule,
		ImageModule,
		BoardModule,
		BoardItemModule,
		UploadModule,
		GenerateModule,
		ExploreModule,
		ProfileModule,
		BatchModule,
		AdminModule,
	],
})
export class AppModule {}
