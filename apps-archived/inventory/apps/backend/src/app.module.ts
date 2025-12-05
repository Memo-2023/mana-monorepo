import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { ItemModule } from './item/item.module';
import { CategoryModule } from './category/category.module';
import { LocationModule } from './location/location.module';
import { PhotoModule } from './photo/photo.module';
import { DocumentModule } from './document/document.module';
import { ImportModule } from './import/import.module';
import { ExportModule } from './export/export.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env', '.env.development'],
		}),
		DatabaseModule,
		StorageModule,
		HealthModule,
		ItemModule,
		CategoryModule,
		LocationModule,
		PhotoModule,
		DocumentModule,
		ImportModule,
		ExportModule,
	],
})
export class AppModule {}
