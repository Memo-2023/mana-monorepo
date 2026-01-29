import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearxngProvider } from './providers/searxng.provider';

@Module({
	controllers: [SearchController],
	providers: [SearchService, SearxngProvider],
	exports: [SearchService],
})
export class SearchModule {}
