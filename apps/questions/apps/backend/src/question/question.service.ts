import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, isNull, ilike, or, inArray } from 'drizzle-orm';
import { questions, Question, NewQuestion } from '../db/schema';
import { CreateQuestionDto, UpdateQuestionDto } from './dto';

@Injectable()
export class QuestionService {
	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase,
	) {}

	async create(userId: string, dto: CreateQuestionDto): Promise<Question> {
		const newQuestion: NewQuestion = {
			userId,
			title: dto.title,
			description: dto.description,
			collectionId: dto.collectionId,
			tags: dto.tags || [],
			priority: dto.priority || 'normal',
			researchDepth: dto.researchDepth || 'quick',
		};

		const [created] = await this.db.insert(questions).values(newQuestion).returning();
		return created;
	}

	async findAll(
		userId: string,
		options?: {
			collectionId?: string;
			status?: string;
			search?: string;
			tags?: string[];
			limit?: number;
			offset?: number;
		},
	): Promise<{ data: Question[]; total: number }> {
		const conditions = [eq(questions.userId, userId), isNull(questions.deletedAt)];

		if (options?.collectionId) {
			conditions.push(eq(questions.collectionId, options.collectionId));
		}

		if (options?.status) {
			conditions.push(eq(questions.status, options.status));
		}

		if (options?.search) {
			conditions.push(
				or(
					ilike(questions.title, `%${options.search}%`),
					ilike(questions.description, `%${options.search}%`),
				),
			);
		}

		const limit = options?.limit || 20;
		const offset = options?.offset || 0;

		const data = await this.db
			.select()
			.from(questions)
			.where(and(...conditions))
			.orderBy(desc(questions.createdAt))
			.limit(limit)
			.offset(offset);

		// For total count, we need a separate query
		const allMatching = await this.db
			.select({ id: questions.id })
			.from(questions)
			.where(and(...conditions));

		return { data, total: allMatching.length };
	}

	async findOne(userId: string, id: string): Promise<Question> {
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, id), eq(questions.userId, userId), isNull(questions.deletedAt)));

		if (!question) {
			throw new NotFoundException(`Question with id ${id} not found`);
		}

		return question;
	}

	async update(userId: string, id: string, dto: UpdateQuestionDto): Promise<Question> {
		// First check if the question exists and belongs to user
		await this.findOne(userId, id);

		const updateData: Partial<NewQuestion> = {
			...dto,
			updatedAt: new Date(),
		};

		const [updated] = await this.db
			.update(questions)
			.set(updateData)
			.where(and(eq(questions.id, id), eq(questions.userId, userId)))
			.returning();

		return updated;
	}

	async delete(userId: string, id: string): Promise<void> {
		// Soft delete
		await this.findOne(userId, id);

		await this.db
			.update(questions)
			.set({ deletedAt: new Date() })
			.where(and(eq(questions.id, id), eq(questions.userId, userId)));
	}

	async updateStatus(userId: string, id: string, status: string): Promise<Question> {
		await this.findOne(userId, id);

		const [updated] = await this.db
			.update(questions)
			.set({ status, updatedAt: new Date() })
			.where(and(eq(questions.id, id), eq(questions.userId, userId)))
			.returning();

		return updated;
	}

	async getByCollection(userId: string, collectionId: string): Promise<Question[]> {
		return this.db
			.select()
			.from(questions)
			.where(
				and(
					eq(questions.userId, userId),
					eq(questions.collectionId, collectionId),
					isNull(questions.deletedAt),
				),
			)
			.orderBy(desc(questions.createdAt));
	}

	async getByTags(userId: string, tags: string[]): Promise<Question[]> {
		// PostgreSQL array overlap query - find questions that have any of the specified tags
		const allQuestions = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.userId, userId), isNull(questions.deletedAt)))
			.orderBy(desc(questions.createdAt));

		// Filter in memory for array overlap (Drizzle doesn't have native array overlap)
		return allQuestions.filter((q) => q.tags?.some((t) => tags.includes(t)));
	}
}
