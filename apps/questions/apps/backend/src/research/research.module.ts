import { Module } from '@nestjs/common';
import { ResearchController } from './research.controller';
import { ResearchService } from './research.service';
import { ManaSearchClient } from './mana-search.client';
import { DatabaseModule } from '../db/database.module';

@Module({
	imports: [DatabaseModule],
	controllers: [ResearchController],
	providers: [ResearchService, ManaSearchClient],
	exports: [ResearchService, ManaSearchClient],
})
export class ResearchModule {}
