import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { generations, projectItems, projects } from '../database/schema';
import { BLOG_STYLES } from '../config/configuration';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class GenerationService {
	private readonly logger = new Logger(GenerationService.name);
	private readonly manaLlmUrl: string;
	private readonly model: string;

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private configService: ConfigService
	) {
		this.manaLlmUrl = this.configService.get<string>('MANA_LLM_URL') || 'http://localhost:3025';
		this.model = this.configService.get<string>('openai.model') || 'ollama/gemma3:4b';
	}

	async generateBlogpost(projectId: string, style: keyof typeof BLOG_STYLES): Promise<string> {
		// Get project info
		const [project] = await this.db.select().from(projects).where(eq(projects.id, projectId));
		if (!project) {
			throw new Error('Project not found');
		}

		// Get all project items
		const items = await this.db
			.select()
			.from(projectItems)
			.where(eq(projectItems.projectId, projectId))
			.orderBy(projectItems.createdAt);

		if (items.length === 0) {
			throw new Error(
				'Keine Inhalte im Projekt. Füge zuerst Fotos, Sprachnotizen oder Text hinzu.'
			);
		}

		// Build content summary
		const contentSummary = items
			.map((item, index) => {
				const timestamp = item.createdAt.toLocaleString('de-DE');
				switch (item.type) {
					case 'photo':
						return `[Foto ${index + 1}] ${timestamp}${item.content ? `: ${item.content}` : ''}`;
					case 'voice':
						return `[Sprachnotiz ${index + 1}] ${timestamp}: "${item.content || 'Keine Transkription'}"`;
					case 'text':
						return `[Notiz ${index + 1}] ${timestamp}: "${item.content}"`;
					default:
						return '';
				}
			})
			.filter(Boolean)
			.join('\n\n');

		const styleConfig = BLOG_STYLES[style];

		const systemPrompt = `Du bist ein erfahrener Blogger und Content-Creator. ${styleConfig.prompt}

Projektname: "${project.name}"
Erstellt am: ${project.createdAt.toLocaleDateString('de-DE')}

Die folgenden Inhalte wurden während des Projekts gesammelt:`;

		const response = await fetch(`${this.manaLlmUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: this.model,
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: contentSummary },
				],
				temperature: 0.7,
				max_tokens: 2000,
			}),
			signal: AbortSignal.timeout(120000),
		});

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error(`mana-llm error: ${response.status} - ${errorText}`);
			throw new Error(`LLM generation failed: ${response.status}`);
		}

		const data = await response.json();
		const content = data.choices?.[0]?.message?.content || '';

		// Save generation
		await this.db.insert(generations).values({
			projectId,
			style,
			content,
		});

		this.logger.log(`Generated ${style} blogpost for project ${projectId}`);
		return content;
	}

	async getLatestGeneration(projectId: string) {
		const [generation] = await this.db
			.select()
			.from(generations)
			.where(eq(generations.projectId, projectId))
			.orderBy(desc(generations.createdAt))
			.limit(1);

		return generation;
	}
}
