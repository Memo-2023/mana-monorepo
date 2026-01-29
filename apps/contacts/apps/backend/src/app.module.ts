import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { DatabaseModule } from './db/database.module';
import { ContactModule } from './contact/contact.module';
import { TagModule } from './tag/tag.module';
import { NoteModule } from './note/note.module';
import { ActivityModule } from './activity/activity.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { ImportModule } from './import/import.module';
import { ExportModule } from './export/export.module';
import { GoogleModule } from './google/google.module';
import { DuplicatesModule } from './duplicates/duplicates.module';
import { PhotoModule } from './photo/photo.module';
import { BatchModule } from './batch/batch.module';
import { NetworkModule } from './network/network.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		MetricsModule.register({
			prefix: 'contacts_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		ContactModule,
		TagModule,
		NoteModule,
		ActivityModule,
		HealthModule.forRoot({ serviceName: 'contacts-backend' }),
		ImportModule,
		ExportModule,
		GoogleModule,
		DuplicatesModule,
		PhotoModule,
		BatchModule,
		NetworkModule,
	],
})
export class AppModule {}
