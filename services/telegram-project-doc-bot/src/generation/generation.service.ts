import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import OpenAI from 'openai';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { Generation, Project, MediaItem } from '../database/schema';
import { BLOG_STYLES } from '../config/configuration';

type BlogStyle = keyof typeof BLOG_STYLES;

@Injectable()
export class GenerationService {
	private readonly logger = new Logger(GenerationService.name);
	private readonly llmProvider: string;
	private readonly ollamaUrl: string;
	private readonly ollamaModel: string;
	private readonly openai: OpenAI | null;

	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: PostgresJsDatabase<typeof schema>,
		private configService: ConfigService
	) {
		this.llmProvider = this.configService.get<string>('llm.provider') || 'ollama';
		this.ollamaUrl = this.configService.get<string>('llm.ollama.url') || 'http://localhost:11434';
		this.ollamaModel = this.configService.get<string>('llm.ollama.model') || 'gemma3:4b';

		const apiKey = this.configService.get<string>('openai.apiKey');
		this.openai = apiKey ? new OpenAI({ apiKey }) : null;

		this.logger.log(`LLM Provider: ${this.llmProvider}`);
	}

	async generateBlogpost(projectId: string, style: BlogStyle = 'casual'): Promise<string> {
		// 1. Load project
		const project = await this.db.query.projects.findFirst({
			where: eq(schema.projects.id, projectId),
		});

		if (!project) {
			throw new Error('Projekt nicht gefunden');
		}

		// 2. Load all media items
		const items = await this.db.query.mediaItems.findMany({
			where: eq(schema.mediaItems.projectId, projectId),
			orderBy: [schema.mediaItems.orderIndex, schema.mediaItems.createdAt],
		});

		if (items.length === 0) {
			throw new Error(
				'Keine Inhalte im Projekt. Füge zuerst Fotos, Sprachnotizen oder Text hinzu.'
			);
		}

		// 3. Build context from media items
		const context = this.buildContext(items);

		// 4. Build prompt
		const styleConfig = BLOG_STYLES[style] || BLOG_STYLES.casual;
		const prompt = this.buildPrompt(project, context, styleConfig.prompt);

		// 5. Generate with LLM
		this.logger.log(`Generating blogpost for "${project.name}" with style "${style}"`);
		const content = await this.callLlm(prompt);

		// 6. Mark previous generations as not latest
		await this.db
			.update(schema.generations)
			.set({ isLatest: false })
			.where(eq(schema.generations.projectId, projectId));

		// 7. Save generation
		const [generation] = await this.db
			.insert(schema.generations)
			.values({
				projectId,
				style,
				content,
				isLatest: true,
			})
			.returning();

		this.logger.log(`Generated blogpost: ${generation.id} (${content.length} chars)`);
		return content;
	}

	private buildContext(items: MediaItem[]): string {
		return items
			.map((item, index) => {
				const num = index + 1;
				const timestamp = item.createdAt.toLocaleString('de-DE', {
					day: '2-digit',
					month: '2-digit',
					hour: '2-digit',
					minute: '2-digit',
				});

				if (item.type === 'photo') {
					const desc = item.aiDescription || item.caption || 'Keine Beschreibung';
					return `[Foto ${num}] (${timestamp})\n${desc}`;
				}

				if (item.type === 'voice') {
					const text = item.transcription || '(Keine Transkription verfügbar)';
					return `[Sprachnotiz ${num}] (${timestamp})\n"${text}"`;
				}

				// text
				return `[Notiz ${num}] (${timestamp})\n${item.caption}`;
			})
			.join('\n\n---\n\n');
	}

	private buildPrompt(project: Project, context: string, stylePrompt: string): string {
		return `Du bist ein erfahrener Blogger und Content Creator.

${stylePrompt}

## Projekt-Informationen
**Name:** ${project.name}
${project.description ? `**Beschreibung:** ${project.description}` : ''}

## Gesammelte Inhalte (chronologisch)

${context}

## Aufgabe

Erstelle einen gut strukturierten Blogbeitrag in Markdown basierend auf den obigen Inhalten.

**Anforderungen:**
- Verwende eine passende, ansprechende Überschrift (# Titel)
- Strukturiere den Beitrag mit Zwischenüberschriften (## Abschnitte)
- Verweise im Text auf die Fotos mit [Foto X], damit sie später eingebettet werden können
- Integriere die Sprachnotizen und Textnotizen natürlich in den Fließtext
- Füge am Ende eine kurze Zusammenfassung oder "Lessons Learned" hinzu
- Schreibe auf Deutsch
- Der Beitrag sollte authentisch und persönlich klingen

Beginne direkt mit dem Blogbeitrag (ohne Einleitung wie "Hier ist der Blogbeitrag"):`;
	}

	private async callLlm(prompt: string): Promise<string> {
		if (this.llmProvider === 'openai' && this.openai) {
			return this.callOpenAI(prompt);
		}

		return this.callOllama(prompt);
	}

	private async callOpenAI(prompt: string): Promise<string> {
		if (!this.openai) {
			throw new Error('OpenAI not configured');
		}

		const response = await this.openai.chat.completions.create({
			model: 'gpt-4o-mini',
			messages: [{ role: 'user', content: prompt }],
			temperature: 0.7,
			max_tokens: 4000,
		});

		return response.choices[0]?.message?.content || '';
	}

	private async callOllama(prompt: string): Promise<string> {
		const response = await fetch(`${this.ollamaUrl}/api/generate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: this.ollamaModel,
				prompt,
				stream: false,
			}),
			signal: AbortSignal.timeout(180000), // 3 minutes timeout
		});

		if (!response.ok) {
			throw new Error(`Ollama API error: ${response.status}`);
		}

		const data = await response.json();
		return data.response || '';
	}

	async getLatestGeneration(projectId: string): Promise<Generation | undefined> {
		return this.db.query.generations.findFirst({
			where: eq(schema.generations.projectId, projectId),
			orderBy: [desc(schema.generations.createdAt)],
		});
	}

	getAvailableStyles(): { key: string; name: string }[] {
		return Object.entries(BLOG_STYLES).map(([key, value]) => ({
			key,
			name: value.name,
		}));
	}
}
