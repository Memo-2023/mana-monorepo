import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import { questions, answers, Answer, NewAnswer } from '../db/schema';
import { CreateAnswerDto, UpdateAnswerDto, RateAnswerDto, AcceptAnswerDto } from './dto';

@Injectable()
export class AnswerService {
	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase,
	) {}

	async create(userId: string, dto: CreateAnswerDto): Promise<Answer> {
		// Verify user owns the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, dto.questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException(`Question with id ${dto.questionId} not found`);
		}

		const newAnswer: NewAnswer = {
			questionId: dto.questionId,
			researchResultId: dto.researchResultId,
			content: dto.content,
			contentMarkdown: dto.contentMarkdown,
			summary: dto.summary,
			modelId: dto.modelId,
			provider: dto.provider,
			promptTokens: dto.promptTokens,
			completionTokens: dto.completionTokens,
			estimatedCost: dto.estimatedCost,
			confidence: dto.confidence,
			sourceCount: dto.sourceCount,
			citations: dto.citations || [],
			durationMs: dto.durationMs,
		};

		const [created] = await this.db.insert(answers).values(newAnswer).returning();
		return created;
	}

	async findByQuestion(userId: string, questionId: string): Promise<Answer[]> {
		// Verify user owns the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException(`Question with id ${questionId} not found`);
		}

		return this.db
			.select()
			.from(answers)
			.where(eq(answers.questionId, questionId))
			.orderBy(desc(answers.createdAt));
	}

	async findOne(userId: string, id: string): Promise<Answer> {
		const [answer] = await this.db.select().from(answers).where(eq(answers.id, id));

		if (!answer) {
			throw new NotFoundException(`Answer with id ${id} not found`);
		}

		// Verify user owns the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, answer.questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException('Answer not found');
		}

		return answer;
	}

	async update(userId: string, id: string, dto: UpdateAnswerDto): Promise<Answer> {
		await this.findOne(userId, id);

		const updateData: Partial<NewAnswer> = {
			...dto,
			updatedAt: new Date(),
		};

		const [updated] = await this.db.update(answers).set(updateData).where(eq(answers.id, id)).returning();

		return updated;
	}

	async rate(userId: string, id: string, dto: RateAnswerDto): Promise<Answer> {
		await this.findOne(userId, id);

		const [updated] = await this.db
			.update(answers)
			.set({
				rating: dto.rating,
				feedback: dto.feedback,
				updatedAt: new Date(),
			})
			.where(eq(answers.id, id))
			.returning();

		return updated;
	}

	async setAccepted(userId: string, id: string, dto: AcceptAnswerDto): Promise<Answer> {
		const answer = await this.findOne(userId, id);

		// If accepting, unset other accepted answers for this question
		if (dto.isAccepted) {
			await this.db
				.update(answers)
				.set({ isAccepted: false, updatedAt: new Date() })
				.where(and(eq(answers.questionId, answer.questionId), eq(answers.isAccepted, true)));
		}

		const [updated] = await this.db
			.update(answers)
			.set({
				isAccepted: dto.isAccepted,
				updatedAt: new Date(),
			})
			.where(eq(answers.id, id))
			.returning();

		return updated;
	}

	async delete(userId: string, id: string): Promise<void> {
		await this.findOne(userId, id);
		await this.db.delete(answers).where(eq(answers.id, id));
	}

	async getAccepted(userId: string, questionId: string): Promise<Answer | null> {
		// Verify user owns the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException(`Question with id ${questionId} not found`);
		}

		const [accepted] = await this.db
			.select()
			.from(answers)
			.where(and(eq(answers.questionId, questionId), eq(answers.isAccepted, true)));

		return accepted || null;
	}
}
