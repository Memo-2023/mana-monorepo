import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, and, desc, sql, count } from 'drizzle-orm';
import { getDb } from '../db/connection';
import { userFeedback, feedbackVotes } from '../db/schema';
import { CreateFeedbackDto, FeedbackQueryDto } from './dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class FeedbackService {
	private readonly logger = new Logger(FeedbackService.name);

	constructor(
		private configService: ConfigService,
		private aiService: AiService
	) {}

	private getDb() {
		const databaseUrl = this.configService.get<string>('database.url');
		return getDb(databaseUrl!);
	}

	async createFeedback(userId: string, appId: string, dto: CreateFeedbackDto) {
		const db = this.getDb();

		// Use AI to generate title and category if not provided
		let title = dto.title;
		let category = dto.category;

		if (!title || !category) {
			this.logger.debug('Analyzing feedback with AI...');
			const analysis = await this.aiService.analyzeFeedback(dto.feedbackText);

			if (!title) {
				title = analysis.title;
			}
			if (!category) {
				category = analysis.category;
			}
			this.logger.debug(`AI generated: title="${title}", category="${category}"`);
		}

		const [feedback] = await db
			.insert(userFeedback)
			.values({
				userId,
				appId,
				title,
				feedbackText: dto.feedbackText,
				category: category || 'feature',
				deviceInfo: dto.deviceInfo,
			})
			.returning();

		return {
			success: true,
			feedback: this.mapFeedback(feedback, false),
		};
	}

	async getPublicFeedback(userId: string | null, query: FeedbackQueryDto) {
		const db = this.getDb();
		const { appId, status, category, sort = 'votes', limit = 20, offset = 0 } = query;

		// Build conditions
		const conditions = [eq(userFeedback.isPublic, true)];

		if (appId) {
			conditions.push(eq(userFeedback.appId, appId));
		}
		if (status) {
			conditions.push(eq(userFeedback.status, status as any));
		}
		if (category) {
			conditions.push(eq(userFeedback.category, category as any));
		}

		// Get feedback items
		const feedbackItems = await db
			.select()
			.from(userFeedback)
			.where(and(...conditions))
			.orderBy(sort === 'votes' ? desc(userFeedback.voteCount) : desc(userFeedback.createdAt))
			.limit(limit)
			.offset(offset);

		// Get total count
		const [{ total }] = await db
			.select({ total: count() })
			.from(userFeedback)
			.where(and(...conditions));

		// Get user's votes (only if authenticated)
		let votedFeedbackIds = new Set<string>();
		if (userId) {
			const feedbackIds = feedbackItems.map((f) => f.id);
			const userVotes =
				feedbackIds.length > 0
					? await db
							.select({ feedbackId: feedbackVotes.feedbackId })
							.from(feedbackVotes)
							.where(
								and(
									eq(feedbackVotes.userId, userId),
									sql`${feedbackVotes.feedbackId} = ANY(${feedbackIds})`
								)
							)
					: [];

			votedFeedbackIds = new Set(userVotes.map((v) => v.feedbackId));
		}

		return {
			success: true,
			items: feedbackItems.map((f) => this.mapFeedback(f, votedFeedbackIds.has(f.id))),
			total,
		};
	}

	async getMyFeedback(userId: string, appId?: string) {
		const db = this.getDb();

		const conditions = [eq(userFeedback.userId, userId)];
		if (appId) {
			conditions.push(eq(userFeedback.appId, appId));
		}

		const feedbackItems = await db
			.select()
			.from(userFeedback)
			.where(and(...conditions))
			.orderBy(desc(userFeedback.createdAt));

		// Get user's votes on their own feedback (for consistency)
		const feedbackIds = feedbackItems.map((f) => f.id);
		const userVotes =
			feedbackIds.length > 0
				? await db
						.select({ feedbackId: feedbackVotes.feedbackId })
						.from(feedbackVotes)
						.where(
							and(
								eq(feedbackVotes.userId, userId),
								sql`${feedbackVotes.feedbackId} = ANY(${feedbackIds})`
							)
						)
				: [];

		const votedFeedbackIds = new Set(userVotes.map((v) => v.feedbackId));

		return {
			success: true,
			items: feedbackItems.map((f) => this.mapFeedback(f, votedFeedbackIds.has(f.id))),
			total: feedbackItems.length,
		};
	}

	async vote(userId: string, feedbackId: string) {
		const db = this.getDb();

		// Check if feedback exists and is public
		const [feedback] = await db
			.select()
			.from(userFeedback)
			.where(eq(userFeedback.id, feedbackId))
			.limit(1);

		if (!feedback) {
			throw new NotFoundException('Feedback not found');
		}

		if (!feedback.isPublic) {
			throw new NotFoundException('Feedback not found or not public');
		}

		// Check if user already voted
		const [existingVote] = await db
			.select()
			.from(feedbackVotes)
			.where(and(eq(feedbackVotes.feedbackId, feedbackId), eq(feedbackVotes.userId, userId)))
			.limit(1);

		if (existingVote) {
			throw new ConflictException('Already voted');
		}

		// Add vote
		await db.insert(feedbackVotes).values({
			feedbackId,
			userId,
		});

		// Increment vote count
		const [updated] = await db
			.update(userFeedback)
			.set({
				voteCount: sql`${userFeedback.voteCount} + 1`,
				updatedAt: new Date(),
			})
			.where(eq(userFeedback.id, feedbackId))
			.returning();

		return {
			success: true,
			newVoteCount: updated.voteCount,
			userHasVoted: true,
		};
	}

	async unvote(userId: string, feedbackId: string) {
		const db = this.getDb();

		// Check if feedback exists
		const [feedback] = await db
			.select()
			.from(userFeedback)
			.where(eq(userFeedback.id, feedbackId))
			.limit(1);

		if (!feedback) {
			throw new NotFoundException('Feedback not found');
		}

		// Check if user has voted
		const [existingVote] = await db
			.select()
			.from(feedbackVotes)
			.where(and(eq(feedbackVotes.feedbackId, feedbackId), eq(feedbackVotes.userId, userId)))
			.limit(1);

		if (!existingVote) {
			throw new NotFoundException('Vote not found');
		}

		// Remove vote
		await db
			.delete(feedbackVotes)
			.where(and(eq(feedbackVotes.feedbackId, feedbackId), eq(feedbackVotes.userId, userId)));

		// Decrement vote count
		const [updated] = await db
			.update(userFeedback)
			.set({
				voteCount: sql`GREATEST(${userFeedback.voteCount} - 1, 0)`,
				updatedAt: new Date(),
			})
			.where(eq(userFeedback.id, feedbackId))
			.returning();

		return {
			success: true,
			newVoteCount: updated.voteCount,
			userHasVoted: false,
		};
	}

	private mapFeedback(
		feedback: typeof userFeedback.$inferSelect,
		userHasVoted: boolean
	): Record<string, unknown> {
		return {
			id: feedback.id,
			userId: feedback.userId,
			appId: feedback.appId,
			title: feedback.title,
			feedbackText: feedback.feedbackText,
			category: feedback.category,
			status: feedback.status,
			isPublic: feedback.isPublic,
			adminResponse: feedback.adminResponse,
			voteCount: feedback.voteCount,
			userHasVoted,
			deviceInfo: feedback.deviceInfo,
			createdAt: feedback.createdAt.toISOString(),
			updatedAt: feedback.updatedAt.toISOString(),
			publishedAt: feedback.publishedAt?.toISOString(),
			completedAt: feedback.completedAt?.toISOString(),
		};
	}
}
