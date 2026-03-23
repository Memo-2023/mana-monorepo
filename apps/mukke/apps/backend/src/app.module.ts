import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './db/database.module';
import { ProjectModule } from './project/project.module';
import { BeatModule } from './beat/beat.module';
import { MarkerModule } from './marker/marker.module';
import { LyricsModule } from './lyrics/lyrics.module';
import { ExportModule } from './export/export.module';
import { SttModule } from './stt/stt.module';
import { SongModule } from './song/song.module';
import { PlaylistModule } from './playlist/playlist.module';
import { LibraryModule } from './library/library.module';
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
		ProjectModule,
		BeatModule,
		MarkerModule,
		LyricsModule,
		ExportModule,
		SttModule,
		SongModule,
		PlaylistModule,
		LibraryModule,
		HealthModule.forRoot({ serviceName: 'mukke-backend' }),
		MetricsModule.register({
			prefix: 'mukke_',
			excludePaths: ['/health'],
		}),
	],
})
export class AppModule {}
