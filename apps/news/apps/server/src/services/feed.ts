import { sql } from 'drizzle-orm';
import type { Database } from '../db/connection';

/**
 * Feed service reads AI-generated articles from sync_changes.
 * Articles with type='feed'|'summary'|'in_depth' and sourceOrigin='ai'.
 */
export class FeedService {
	constructor(private db: Database) {}

	async getArticles(opts: { type?: string; categoryId?: string; limit?: number; offset?: number }) {
		const limit = opts.limit || 20;
		const offset = opts.offset || 0;

		let whereClause = sql`app_id = 'news' AND table_name = 'articles' AND op != 'delete'`;

		if (opts.type) {
			whereClause = sql`${whereClause} AND data->>'type' = ${opts.type}`;
		}
		if (opts.categoryId) {
			whereClause = sql`${whereClause} AND data->>'categoryId' = ${opts.categoryId}`;
		}

		const result = await this.db.execute(sql`
			SELECT DISTINCT ON (record_id)
				record_id as id,
				data->>'title' as title,
				data->>'excerpt' as excerpt,
				data->>'author' as author,
				data->>'imageUrl' as "imageUrl",
				data->>'type' as type,
				data->>'categoryId' as "categoryId",
				(data->>'wordCount')::int as "wordCount",
				(data->>'readingTimeMinutes')::int as "readingTimeMinutes",
				data->>'publishedAt' as "publishedAt",
				created_at as "createdAt"
			FROM sync_changes
			WHERE ${whereClause}
			ORDER BY record_id, created_at DESC
			LIMIT ${limit} OFFSET ${offset}
		`);

		return result as unknown as Record<string, unknown>[];
	}

	async getArticleById(id: string) {
		const result = await this.db.execute(sql`
			SELECT DISTINCT ON (record_id)
				record_id as id,
				data->>'title' as title,
				data->>'content' as content,
				data->>'htmlContent' as "htmlContent",
				data->>'excerpt' as excerpt,
				data->>'author' as author,
				data->>'imageUrl' as "imageUrl",
				data->>'originalUrl' as "originalUrl",
				data->>'type' as type,
				(data->>'wordCount')::int as "wordCount",
				(data->>'readingTimeMinutes')::int as "readingTimeMinutes",
				data->>'publishedAt' as "publishedAt",
				created_at as "createdAt"
			FROM sync_changes
			WHERE app_id = 'news' AND table_name = 'articles' AND record_id = ${id} AND op != 'delete'
			ORDER BY record_id, created_at DESC
			LIMIT 1
		`);

		const rows = result as unknown as Record<string, unknown>[];
		return rows[0] ?? null;
	}
}
