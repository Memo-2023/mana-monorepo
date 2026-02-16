import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { ProjectModule } from './project/project.module';
import { BeatModule } from './beat/beat.module';
import { MarkerModule } from './marker/marker.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { ExportModule } from './export/export.module';
import { SttModule } from './stt/stt.module';
import { HealthModule } from '@manacore/shared-nestjs-health';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		DatabaseModule,
		ProjectModule,
		BeatModule,
		MarkerModule,
		LyricsModule,
		ExportModule,
		SttModule,
		HealthModule.forRoot({ serviceName: 'lightwrite-backend' }),
	],
})
export class AppModule {}
