import { Injectable, Inject, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc } from 'drizzle-orm';
import {
	questions,
	researchResults,
	sources,
	ResearchResult,
	NewResearchResult,
	NewSource,
} from '../db/schema';
import { ManaSearchClient, SearchResult } from './mana-search.client';
import { StartResearchDto, ResearchDepth } from './dto';

interface DepthConfig {
	maxSources: number;
	extractContent: boolean;
	searchCategories: string[];
}

const DEPTH_CONFIG: Record<ResearchDepth, DepthConfig> = {
	[ResearchDepth.QUICK]: {
		maxSources: 5,
		extractContent: false,
		searchCategories: ['general'],
	},
	[ResearchDepth.STANDARD]: {
		maxSources: 15,
		extractContent: true,
		searchCategories: ['general', 'news'],
	},
	[ResearchDepth.DEEP]: {
		maxSources: 30,
		extractContent: true,
		searchCategories: ['general', 'news', 'science', 'it'],
	},
};

@Injectable()
export class ResearchService {
	private readonly logger = new Logger(ResearchService.name);

	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase,
		private readonly manaSearchClient: ManaSearchClient,
	) {}

	async startResearch(userId: string, dto: StartResearchDto): Promise<ResearchResult> {
		const startTime = Date.now();

		// Get the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, dto.questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException(`Question with id ${dto.questionId} not found`);
		}

		// Check if question is already being researched
		if (question.status === 'researching') {
			throw new BadRequestException('Research is already in progress for this question');
		}

		// Update question status
		await this.db
			.update(questions)
			.set({ status: 'researching', updatedAt: new Date() })
			.where(eq(questions.id, dto.questionId));

		try {
			const depth = dto.depth || (question.researchDepth as ResearchDepth) || ResearchDepth.QUICK;
			const config = DEPTH_CONFIG[depth];

			// Perform search
			const searchResponse = await this.manaSearchClient.search(question.title, {
				categories: dto.categories || config.searchCategories,
				engines: dto.engines,
				language: dto.language || 'de-DE',
				limit: dto.maxSources || config.maxSources,
			});

			// Extract content for sources if depth allows
			let extractedSources: Array<SearchResult & { extractedContent?: string; markdown?: string }> =
				searchResponse.results;

			if (config.extractContent && searchResponse.results.length > 0) {
				const urls = searchResponse.results.slice(0, config.maxSources).map((r) => r.url);
				const bulkExtract = await this.manaSearchClient.bulkExtract(urls);

				extractedSources = searchResponse.results.map((result) => {
					const extracted = bulkExtract.results.find((e) => e.url === result.url);
					return {
						...result,
						extractedContent: extracted?.success ? extracted.content?.text : undefined,
						markdown: extracted?.success ? extracted.content?.markdown : undefined,
					};
				});
			}

			// Generate summary from results
			const summary = this.generateSummary(question.title, extractedSources);
			const keyPoints = this.extractKeyPoints(extractedSources);
			const followUpQuestions = this.generateFollowUpQuestions(question.title, extractedSources);

			// Save research result
			const newResearchResult: NewResearchResult = {
				questionId: dto.questionId,
				modelId: 'mana-search',
				provider: 'searxng',
				researchDepth: depth,
				summary,
				keyPoints,
				followUpQuestions,
				durationMs: Date.now() - startTime,
			};

			const [researchResult] = await this.db
				.insert(researchResults)
				.values(newResearchResult)
				.returning();

			// Save sources
			if (extractedSources.length > 0) {
				const sourcesToInsert: NewSource[] = extractedSources.map((source, index) => ({
					researchResultId: researchResult.id,
					url: source.url,
					title: source.title,
					snippet: source.snippet,
					domain: new URL(source.url).hostname,
					extractedContent: source.extractedContent,
					contentMarkdown: source.markdown,
					relevanceScore: source.score,
					position: index + 1,
					engine: source.engine,
				}));

				await this.db.insert(sources).values(sourcesToInsert);
			}

			// Update question status
			await this.db
				.update(questions)
				.set({ status: 'answered', updatedAt: new Date() })
				.where(eq(questions.id, dto.questionId));

			return researchResult;
		} catch (error) {
			// Reset question status on error
			await this.db
				.update(questions)
				.set({ status: 'open', updatedAt: new Date() })
				.where(eq(questions.id, dto.questionId));

			this.logger.error(`Research failed for question ${dto.questionId}: ${error}`);
			throw error;
		}
	}

	async getResearchResults(userId: string, questionId: string): Promise<ResearchResult[]> {
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
			.from(researchResults)
			.where(eq(researchResults.questionId, questionId))
			.orderBy(desc(researchResults.createdAt));
	}

	async getResearchResult(
		userId: string,
		resultId: string,
	): Promise<ResearchResult & { sources: any[] }> {
		const [result] = await this.db
			.select()
			.from(researchResults)
			.where(eq(researchResults.id, resultId));

		if (!result) {
			throw new NotFoundException(`Research result with id ${resultId} not found`);
		}

		// Verify user owns the question
		const [question] = await this.db
			.select()
			.from(questions)
			.where(and(eq(questions.id, result.questionId), eq(questions.userId, userId)));

		if (!question) {
			throw new NotFoundException('Research result not found');
		}

		// Get sources
		const resultSources = await this.db
			.select()
			.from(sources)
			.where(eq(sources.researchResultId, resultId))
			.orderBy(sources.position);

		return {
			...result,
			sources: resultSources,
		};
	}

	private generateSummary(
		question: string,
		sources: Array<SearchResult & { extractedContent?: string }>,
	): string {
		if (sources.length === 0) {
			return 'No relevant sources found for this question.';
		}

		// Simple summary from snippets (in production, this would use an LLM)
		const snippets = sources
			.filter((s) => s.snippet || s.extractedContent)
			.slice(0, 5)
			.map((s) => s.snippet || s.extractedContent?.substring(0, 500))
			.join('\n\n');

		return `Research found ${sources.length} relevant sources for: "${question}"\n\nKey findings:\n${snippets}`;
	}

	private extractKeyPoints(
		sources: Array<SearchResult & { extractedContent?: string }>,
	): string[] {
		// Extract key points from titles and snippets
		return sources
			.filter((s) => s.title)
			.slice(0, 5)
			.map((s) => s.title);
	}

	private generateFollowUpQuestions(
		question: string,
		sources: Array<SearchResult>,
	): string[] {
		// Generate related questions (in production, this would use an LLM)
		const baseQuestions = [
			`What are the main challenges related to ${question}?`,
			`What are the latest developments in ${question}?`,
			`How does ${question} compare to alternatives?`,
		];

		return baseQuestions;
	}
}
