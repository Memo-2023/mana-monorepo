import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { questions, researchResults, sources, Source } from '../db/schema';

@Injectable()
export class SourceService {
	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase,
	) {}

	async findByResearchResult(userId: string, researchResultId: string): Promise<Source[]> {
		// Verify user owns the research result
		await this.verifyOwnership(userId, researchResultId);

		return this.db
			.select()
			.from(sources)
			.where(eq(sources.researchResultId, researchResultId))
			.orderBy(sources.position);
	}

	async findOne(userId: string, id: string): Promise<Source> {
		const [source] = await this.db.select().from(sources).where(eq(sources.id, id));

		if (!source) {
			throw new NotFoundException(`Source with id ${id} not found`);
		}

		// Verify user owns the source via research result
		await this.verifyOwnership(userId, source.researchResultId);

		return source;
	}

	async findByQuestion(userId: string, questionId: string): Promise<Source[]> {
		// Verify user owns the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException(`Question with id ${questionId} not found`);
		}

		// Get all sources from all research results for this question
		const results = await this.db
			.select()
			.from(researchResults)
			.where(eq(researchResults.questionId, questionId));

		if (results.length === 0) {
			return [];
		}

		const allSources: Source[] = [];
		for (const result of results) {
			const resultSources = await this.db
				.select()
				.from(sources)
				.where(eq(sources.researchResultId, result.id))
				.orderBy(sources.position);
			allSources.push(...resultSources);
		}

		return allSources;
	}

	async getContent(userId: string, id: string): Promise<{ text: string; markdown?: string }> {
		const source = await this.findOne(userId, id);

		return {
			text: source.extractedContent || source.snippet || '',
			markdown: source.contentMarkdown || undefined,
		};
	}

	private async verifyOwnership(userId: string, researchResultId: string): Promise<void> {
		const [result] = await this.db
			.select()
			.from(researchResults)
			.where(eq(researchResults.id, researchResultId));

		if (!result) {
			throw new NotFoundException('Research result not found');
		}

		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, result.questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException('Source not found');
		}
	}
}
