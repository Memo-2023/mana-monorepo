import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { FileModule } from './file/file.module';
import { FolderModule } from './folder/folder.module';
import { ShareModule } from './share/share.module';
import { TagModule } from './tag/tag.module';
import { TrashModule } from './trash/trash.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'storage-backend', route: 'api/v1/health' }),
		StorageModule,
		FileModule,
		FolderModule,
		ShareModule,
		TagModule,
		TrashModule,
		SearchModule,
	],
})
export class AppModule {}
