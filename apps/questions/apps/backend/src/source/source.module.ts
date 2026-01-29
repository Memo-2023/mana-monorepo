import { Module } from '@nestjs/common';
import { SourceController } from './source.controller';
import { SourceService } from './source.service';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [SourceController],
	providers: [SourceService],
	exports: [SourceService],
})
export class SourceModule {}
