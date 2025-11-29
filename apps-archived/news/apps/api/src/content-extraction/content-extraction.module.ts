import { Module } from '@nestjs/common';
import { ContentExtractionController } from './content-extraction.controller';
import { ContentExtractionService } from './content-extraction.service';
import { ArticlesModule } from '../articles/articles.module';
import { AuthModule } from '../auth/auth.module';

@Module({
	imports: [ArticlesModule, AuthModule],
	controllers: [ContentExtractionController],
	providers: [ContentExtractionService],
	exports: [ContentExtractionService],
})
export class ContentExtractionModule {}
