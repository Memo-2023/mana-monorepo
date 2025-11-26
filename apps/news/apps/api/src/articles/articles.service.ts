import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DATABASE_CONNECTION } from '../database/database.module';
import {
  Database,
  articles,
  Article,
  eq,
  and,
  desc,
} from '@manacore/news-database';

@Injectable()
export class ArticlesService {
  constructor(@Inject(DATABASE_CONNECTION) private database: Database) {}

  // Get AI-generated articles (feed, summary, in_depth)
  async getAIArticles(options: {
    type?: 'feed' | 'summary' | 'in_depth';
    categoryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<Article[]> {
    const { type, categoryId, limit = 20, offset = 0 } = options;

    const conditions = [eq(articles.sourceOrigin, 'ai')];

    if (type) {
      conditions.push(eq(articles.type, type));
    }

    if (categoryId) {
      conditions.push(eq(articles.categoryId, categoryId));
    }

    return this.database
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.publishedAt))
      .limit(limit)
      .offset(offset);
  }

  // Get user-saved articles
  async getSavedArticles(
    userId: string,
    includeArchived = false,
  ): Promise<Article[]> {
    const conditions = [
      eq(articles.sourceOrigin, 'user_saved'),
      eq(articles.userId, userId),
    ];

    if (!includeArchived) {
      conditions.push(eq(articles.isArchived, false));
    }

    return this.database
      .select()
      .from(articles)
      .where(and(...conditions))
      .orderBy(desc(articles.createdAt));
  }

  // Get single article by ID
  async getArticleById(articleId: string): Promise<Article | null> {
    const [article] = await this.database
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .limit(1);

    return article || null;
  }

  // Create a saved article
  async createSavedArticle(data: {
    userId: string;
    title: string;
    content: string;
    parsedContent: string;
    originalUrl: string;
    author?: string;
    imageUrl?: string;
  }): Promise<Article> {
    const wordCount = data.content.split(/\s+/).length;
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    const [article] = await this.database
      .insert(articles)
      .values({
        type: 'saved',
        sourceOrigin: 'user_saved',
        userId: data.userId,
        title: data.title,
        content: data.content,
        parsedContent: data.parsedContent,
        originalUrl: data.originalUrl,
        author: data.author,
        imageUrl: data.imageUrl,
        wordCount,
        readingTimeMinutes,
        isArchived: false,
      })
      .returning();

    return article;
  }

  // Archive an article
  async archiveArticle(articleId: string, userId: string): Promise<void> {
    const result = await this.database
      .update(articles)
      .set({ isArchived: true, updatedAt: new Date() })
      .where(and(eq(articles.id, articleId), eq(articles.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Article not found');
    }
  }

  // Unarchive an article
  async unarchiveArticle(articleId: string, userId: string): Promise<void> {
    const result = await this.database
      .update(articles)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(and(eq(articles.id, articleId), eq(articles.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Article not found');
    }
  }

  // Delete an article
  async deleteArticle(articleId: string, userId: string): Promise<void> {
    const result = await this.database
      .delete(articles)
      .where(and(eq(articles.id, articleId), eq(articles.userId, userId)))
      .returning();

    if (result.length === 0) {
      throw new NotFoundException('Article not found');
    }
  }
}
