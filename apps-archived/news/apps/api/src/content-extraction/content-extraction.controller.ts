import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ContentExtractionService } from './content-extraction.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@manacore/news-database';
import { IsUrl } from 'class-validator';

class ExtractUrlDto {
	@IsUrl()
	url: string;
}

@Controller('extract')
export class ContentExtractionController {
	constructor(private contentExtractionService: ContentExtractionService) {}

	// Protected: Save article from URL
	@Post('save')
	@UseGuards(AuthGuard)
	async saveFromUrl(@Body() body: ExtractUrlDto, @CurrentUser() user: User) {
		const article = await this.contentExtractionService.saveArticleFromUrl(user.id, body.url);

		return {
			success: true,
			article: {
				id: article.id,
				title: article.title,
				createdAt: article.createdAt,
			},
		};
	}

	// Public: Preview URL extraction (without saving)
	@Post('preview')
	async previewUrl(@Body() body: ExtractUrlDto) {
		const extracted = await this.contentExtractionService.extractFromUrl(body.url);

		return {
			title: extracted.title,
			excerpt: extracted.excerpt,
			byline: extracted.byline,
			siteName: extracted.siteName,
			contentLength: extracted.content.length,
		};
	}
}
