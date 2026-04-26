/**
 * Feedback Service — Public-Community-Hub backend.
 *
 * Public reads are anonymous: callers receive the persistent pseudonym
 * (display_name) but never the underlying userId. Writes (create / react /
 * delete) require auth at the route layer; the service trusts the
 * userId argument.
 *
 * Reactions follow the Slack pattern: a user can stack multiple emojis
 * on the same item. Aggregated counts are mirrored to
 * `user_feedback.reactions` so the public feed sorts on a cached score
 * column.
 */

import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { userFeedback, feedbackReactions } from '../db/schema/feedback';
import type { Database } from '../db/connection';
import { NotFoundError, BadRequestError } from '../lib/errors';
import { createDisplayHash, generateDisplayName } from '../lib/pseudonym';

/**
 * Allowed reaction emojis with sort-score weights.
 * Add a new emoji here to make it submittable.
 */
const REACTION_WEIGHTS: Record<string, number> = {
	'👍': 1,
	'❤️': 1,
	'🚀': 2,
	'🤔': 0,
	'🎉': 1,
};

const ALLOWED_EMOJIS = Object.keys(REACTION_WEIGHTS);

export type PublicFeedbackItem = {
	id: string;
	appId: string;
	title: string | null;
	feedbackText: string;
	category: string;
	status: string;
	moduleContext: string | null;
	parentId: string | null;
	displayName: string;
	reactions: Record<string, number>;
	score: number;
	adminResponse: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export class FeedbackService {
	constructor(
		private db: Database,
		private llmUrl: string,
		/** Secret used to derive non-reversible per-user display hashes. */
		private pseudonymSecret: string
	) {}

	// ── Submission ────────────────────────────────────────────────────

	async createFeedback(
		userId: string,
		data: {
			appId: string;
			feedbackText: string;
			category?: string;
			title?: string;
			isPublic?: boolean;
			moduleContext?: string;
			parentId?: string;
			deviceInfo?: Record<string, unknown>;
		}
	) {
		let title = data.title;

		// Auto-title via mana-llm only for top-level items; replies inherit
		// context from parent and don't need their own title.
		if (!title && !data.parentId && this.llmUrl) {
			try {
				title = await this.generateTitle(data.feedbackText);
			} catch {
				title = data.feedbackText.slice(0, 80);
			}
		}

		const displayHash = createDisplayHash(userId, this.pseudonymSecret);
		const displayName = generateDisplayName(displayHash);

		const [feedback] = await this.db
			.insert(userFeedback)
			.values({
				userId,
				appId: data.appId,
				title: title || data.feedbackText.slice(0, 80),
				feedbackText: data.feedbackText,
				category: (data.category as any) || 'other',
				...(typeof data.isPublic === 'boolean' ? { isPublic: data.isPublic } : {}),
				moduleContext: data.moduleContext ?? null,
				parentId: data.parentId ?? null,
				displayHash,
				displayName,
				deviceInfo: data.deviceInfo,
			})
			.returning();

		return feedback;
	}

	// ── Public reads (no auth) ────────────────────────────────────────

	/**
	 * Public feed: top-level items only (parent_id IS NULL), is_public=true.
	 * Sorted by cached score desc, then recency. Output is redacted —
	 * userId / displayHash / deviceInfo never leave the service.
	 */
	async getPublicFeed(
		opts: {
			appId?: string;
			moduleContext?: string;
			category?: string;
			status?: string;
			limit?: number;
			offset?: number;
		} = {}
	): Promise<PublicFeedbackItem[]> {
		const { appId, moduleContext, category, status, limit = 50, offset = 0 } = opts;

		const conditions = [eq(userFeedback.isPublic, true), isNull(userFeedback.parentId)];
		if (appId) conditions.push(eq(userFeedback.appId, appId));
		if (moduleContext) conditions.push(eq(userFeedback.moduleContext, moduleContext));
		if (category) conditions.push(eq(userFeedback.category, category as any));
		if (status) conditions.push(eq(userFeedback.status, status as any));

		const rows = await this.db
			.select()
			.from(userFeedback)
			.where(and(...conditions))
			.orderBy(desc(userFeedback.score), desc(userFeedback.createdAt))
			.limit(limit)
			.offset(offset);

		return rows.map(redact);
	}

	/** Replies for a single parent item (1-level threading). */
	async getReplies(parentId: string): Promise<PublicFeedbackItem[]> {
		const rows = await this.db
			.select()
			.from(userFeedback)
			.where(and(eq(userFeedback.parentId, parentId), eq(userFeedback.isPublic, true)))
			.orderBy(userFeedback.createdAt);
		return rows.map(redact);
	}

	/** Single public item by id. Returns null if not found / not public. */
	async getPublicItem(id: string): Promise<PublicFeedbackItem | null> {
		const [row] = await this.db
			.select()
			.from(userFeedback)
			.where(and(eq(userFeedback.id, id), eq(userFeedback.isPublic, true)))
			.limit(1);
		return row ? redact(row) : null;
	}

	// ── Authenticated reads ───────────────────────────────────────────

	/** Items the user has authored (across all isPublic states). */
	async getMyFeedback(userId: string) {
		return this.db
			.select()
			.from(userFeedback)
			.where(eq(userFeedback.userId, userId))
			.orderBy(desc(userFeedback.createdAt));
	}

	/** Map of emoji → boolean for the requesting user on a feedback item. */
	async getMyReactionsFor(feedbackId: string, userId: string): Promise<string[]> {
		const rows = await this.db
			.select({ emoji: feedbackReactions.emoji })
			.from(feedbackReactions)
			.where(
				and(eq(feedbackReactions.feedbackId, feedbackId), eq(feedbackReactions.userId, userId))
			);
		return rows.map((r) => r.emoji);
	}

	// ── Reactions ─────────────────────────────────────────────────────

	/**
	 * Toggle a single emoji reaction for (feedbackId, userId).
	 * Returns the updated reaction-counter map and score.
	 */
	async toggleReaction(
		feedbackId: string,
		userId: string,
		emoji: string
	): Promise<{ reactions: Record<string, number>; score: number; userHasReacted: boolean }> {
		if (!ALLOWED_EMOJIS.includes(emoji)) {
			throw new BadRequestError(`Unsupported emoji: ${emoji}`);
		}

		// Ensure target item exists.
		const [item] = await this.db
			.select({ id: userFeedback.id })
			.from(userFeedback)
			.where(eq(userFeedback.id, feedbackId))
			.limit(1);
		if (!item) throw new NotFoundError('Feedback not found');

		// Try to insert (react). If conflicting → user already reacted, so unreact.
		const inserted = await this.db
			.insert(feedbackReactions)
			.values({ feedbackId, userId, emoji })
			.onConflictDoNothing()
			.returning();

		let userHasReacted: boolean;
		if (inserted.length === 0) {
			// Already reacted → remove the row (unreact).
			await this.db
				.delete(feedbackReactions)
				.where(
					and(
						eq(feedbackReactions.feedbackId, feedbackId),
						eq(feedbackReactions.userId, userId),
						eq(feedbackReactions.emoji, emoji)
					)
				);
			userHasReacted = false;
		} else {
			userHasReacted = true;
		}

		// Recompute aggregated reactions + score for this item.
		const aggregated = await this.recomputeReactions(feedbackId);
		return { ...aggregated, userHasReacted };
	}

	/** Recomputes user_feedback.reactions + score from feedback_reactions. */
	private async recomputeReactions(
		feedbackId: string
	): Promise<{ reactions: Record<string, number>; score: number }> {
		const rows = await this.db
			.select({ emoji: feedbackReactions.emoji, count: sql<number>`count(*)::int` })
			.from(feedbackReactions)
			.where(eq(feedbackReactions.feedbackId, feedbackId))
			.groupBy(feedbackReactions.emoji);

		const reactions: Record<string, number> = {};
		let score = 0;
		for (const row of rows) {
			reactions[row.emoji] = row.count;
			score += (REACTION_WEIGHTS[row.emoji] ?? 0) * row.count;
		}

		await this.db
			.update(userFeedback)
			.set({ reactions, score, updatedAt: new Date() })
			.where(eq(userFeedback.id, feedbackId));

		return { reactions, score };
	}

	// ── Mutations ─────────────────────────────────────────────────────

	async deleteFeedback(feedbackId: string, userId: string) {
		const result = await this.db
			.delete(userFeedback)
			.where(and(eq(userFeedback.id, feedbackId), eq(userFeedback.userId, userId)))
			.returning();
		if (result.length === 0) throw new NotFoundError('Feedback not found');
		return { success: true };
	}

	// ── Admin (founder-tier-gated at route layer) ─────────────────────

	async adminListAll(
		opts: {
			appId?: string;
			category?: string;
			status?: string;
			moduleContext?: string;
			limit?: number;
			offset?: number;
		} = {}
	) {
		const { appId, category, status, moduleContext, limit = 100, offset = 0 } = opts;
		const conditions = [];
		if (appId) conditions.push(eq(userFeedback.appId, appId));
		if (category) conditions.push(eq(userFeedback.category, category as any));
		if (status) conditions.push(eq(userFeedback.status, status as any));
		if (moduleContext) conditions.push(eq(userFeedback.moduleContext, moduleContext));

		return this.db
			.select()
			.from(userFeedback)
			.where(conditions.length ? and(...conditions) : undefined)
			.orderBy(desc(userFeedback.createdAt))
			.limit(limit)
			.offset(offset);
	}

	async adminUpdate(
		feedbackId: string,
		patch: { status?: string; adminResponse?: string; isPublic?: boolean }
	) {
		const update: Record<string, unknown> = { updatedAt: new Date() };
		if (patch.status !== undefined) update.status = patch.status;
		if (patch.adminResponse !== undefined) update.adminResponse = patch.adminResponse;
		if (patch.isPublic !== undefined) update.isPublic = patch.isPublic;

		const [row] = await this.db
			.update(userFeedback)
			.set(update)
			.where(eq(userFeedback.id, feedbackId))
			.returning();
		if (!row) throw new NotFoundError('Feedback not found');
		return row;
	}

	// ── LLM helpers ───────────────────────────────────────────────────

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

/** Strips userId / displayHash / deviceInfo from a row. */
function redact(row: typeof userFeedback.$inferSelect): PublicFeedbackItem {
	return {
		id: row.id,
		appId: row.appId,
		title: row.title,
		feedbackText: row.feedbackText,
		category: row.category,
		status: row.status,
		moduleContext: row.moduleContext,
		parentId: row.parentId,
		displayName: row.displayName ?? 'Anonym',
		reactions: (row.reactions as Record<string, number>) ?? {},
		score: row.score,
		adminResponse: row.adminResponse,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

export { ALLOWED_EMOJIS, REACTION_WEIGHTS };
