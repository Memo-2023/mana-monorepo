/**
 * Feedback Service — User feedback CRUD with voting
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { userFeedback, feedbackVotes } from '../db/schema/feedback';
import type { Database } from '../db/connection';
import { NotFoundError } from '../lib/errors';

export class FeedbackService {
	constructor(
		private db: Database,
		private llmUrl: string
	) {}

	async createFeedback(
		userId: string,
		data: {
			appId: string;
			feedbackText: string;
			category?: string;
			title?: string;
			deviceInfo?: Record<string, unknown>;
		}
	) {
		let title = data.title;

		// Auto-generate title via LLM if not provided
		if (!title && this.llmUrl) {
			try {
				title = await this.generateTitle(data.feedbackText);
			} catch {
				title = data.feedbackText.slice(0, 80);
			}
		}

		const [feedback] = await this.db
			.insert(userFeedback)
			.values({
				userId,
				appId: data.appId,
				title: title || data.feedbackText.slice(0, 80),
				feedbackText: data.feedbackText,
				category: (data.category as any) || 'other',
				deviceInfo: data.deviceInfo,
			})
			.returning();

		return feedback;
	}

	async getPublicFeedback(appId?: string, limit = 50, offset = 0) {
		let query = this.db
			.select()
			.from(userFeedback)
			.where(eq(userFeedback.isPublic, true))
			.orderBy(desc(userFeedback.voteCount))
			.limit(limit)
			.offset(offset);

		return query;
	}

	async getMyFeedback(userId: string) {
		return this.db
			.select()
			.from(userFeedback)
			.where(eq(userFeedback.userId, userId))
			.orderBy(desc(userFeedback.createdAt));
	}

	async vote(feedbackId: string, userId: string) {
		await this.db.insert(feedbackVotes).values({ feedbackId, userId }).onConflictDoNothing();
		await this.db
			.update(userFeedback)
			.set({ voteCount: sql`${userFeedback.voteCount} + 1` })
			.where(eq(userFeedback.id, feedbackId));
		return { success: true };
	}

	async unvote(feedbackId: string, userId: string) {
		const result = await this.db
			.delete(feedbackVotes)
			.where(and(eq(feedbackVotes.feedbackId, feedbackId), eq(feedbackVotes.userId, userId)))
			.returning();

		if (result.length > 0) {
			await this.db
				.update(userFeedback)
				.set({ voteCount: sql`GREATEST(${userFeedback.voteCount} - 1, 0)` })
				.where(eq(userFeedback.id, feedbackId));
		}
		return { success: true };
	}

	async deleteFeedback(feedbackId: string, userId: string) {
		const result = await this.db
			.delete(userFeedback)
			.where(and(eq(userFeedback.id, feedbackId), eq(userFeedback.userId, userId)))
			.returning();
		if (result.length === 0) throw new NotFoundError('Feedback not found');
		return { success: true };
	}

	private async generateTitle(text: string): Promise<string> {
		const res = await fetch(`${this.llmUrl}/api/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				messages: [
					{
						role: 'system',
						content:
							'Generate a short title (max 80 chars) for this feedback. Reply with only the title.',
					},
					{ role: 'user', content: text },
				],
				model: 'gemma3:4b',
				max_tokens: 50,
			}),
		});
		if (!res.ok) throw new Error('LLM failed');
		const data = await res.json();
		return data.choices?.[0]?.message?.content?.trim() || text.slice(0, 80);
	}
}
