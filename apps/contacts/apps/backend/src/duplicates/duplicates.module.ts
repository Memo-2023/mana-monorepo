import { Module } from '@nestjs/common';
import { DuplicatesController } from './duplicates.controller';
import { DuplicatesService } from './duplicates.service';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [DuplicatesController],
	providers: [DuplicatesService],
	exports: [DuplicatesService],
})
export class DuplicatesModule {}
