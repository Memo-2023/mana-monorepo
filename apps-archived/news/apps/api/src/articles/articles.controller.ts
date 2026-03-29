import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ArticlesService } from './articles.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '@manacore/news-database';

@Controller('articles')
export class ArticlesController {
	constructor(private articlesService: ArticlesService) {}

	// Public: Get AI-generated articles
	@Get()
	async getArticles(
		@Query('type') type?: 'feed' | 'summary' | 'in_depth',
		@Query('categoryId') categoryId?: string,
		@Query('limit') limit?: string,
		@Query('offset') offset?: string
	) {
		return this.articlesService.getAIArticles({
			type,
			categoryId,
			limit: limit ? parseInt(limit, 10) : 20,
			offset: offset ? parseInt(offset, 10) : 0,
		});
	}

	// Public: Get single article
	@Get(':id')
	async getArticle(@Param('id') id: string) {
		const article = await this.articlesService.getArticleById(id);
		if (!article) {
			return { error: 'Article not found' };
		}
		return article;
	}

	// Protected: Get user's saved articles
	@Get('saved/list')
	@UseGuards(AuthGuard)
	async getSavedArticles(
		@CurrentUser() user: User,
		@Query('includeArchived') includeArchived?: string
	) {
		return this.articlesService.getSavedArticles(user.id, includeArchived === 'true');
	}

	// Protected: Archive article
	@Post(':id/archive')
	@UseGuards(AuthGuard)
	async archiveArticle(@Param('id') id: string, @CurrentUser() user: User) {
		await this.articlesService.archiveArticle(id, user.id);
		return { success: true };
	}

	// Protected: Unarchive article
	@Post(':id/unarchive')
	@UseGuards(AuthGuard)
	async unarchiveArticle(@Param('id') id: string, @CurrentUser() user: User) {
		await this.articlesService.unarchiveArticle(id, user.id);
		return { success: true };
	}

	// Protected: Delete article
	@Delete(':id')
	@UseGuards(AuthGuard)
	async deleteArticle(@Param('id') id: string, @CurrentUser() user: User) {
		await this.articlesService.deleteArticle(id, user.id);
		return { success: true };
	}
}
