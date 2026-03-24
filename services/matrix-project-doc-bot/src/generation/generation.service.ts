import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { LlmClientService } from '@manacore/shared-llm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { generations, projectItems, projects } from '../database/schema';
import { BLOG_STYLES } from '../config/configuration';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

@Injectable()
export class GenerationService {
	private readonly logger = new Logger(GenerationService.name);

	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private readonly llm: LlmClientService
	) {}

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

		const result = await this.llm.chat(contentSummary, {
			systemPrompt,
			temperature: 0.7,
			maxTokens: 2000,
		});

		// Save generation
		await this.db.insert(generations).values({
			projectId,
			style,
			content: result.content,
		});

		this.logger.log(`Generated ${style} blogpost for project ${projectId}`);
		return result.content;
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
