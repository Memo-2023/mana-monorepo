import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { ProjectModule } from '../project/project.module';
import { BeatModule } from '../beat/beat.module';
import { MarkerModule } from '../marker/marker.module';
import { LyricsModule } from '../lyrics/lyrics.module';

@Module({
	imports: [ProjectModule, BeatModule, MarkerModule, LyricsModule],
	controllers: [ExportController],
	providers: [ExportService],
	exports: [ExportService],
})
export class ExportModule {}
