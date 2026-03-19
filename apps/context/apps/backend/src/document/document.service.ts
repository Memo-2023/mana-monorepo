import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc, or, sql } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { documents } from '../db/schema/documents.schema';
import type { Document, NewDocument, DocumentMetadata } from '../db/schema/documents.schema';
import { SpaceService } from '../space/space.service';

function countWords(text: string): number {
	if (!text) return 0;
	return text
		.trim()
		.split(/\s+/)
		.filter((w) => w.length > 0).length;
}

function estimateTokens(text: string): number {
	if (!text) return 0;
	return Math.ceil(text.length / 4);
}

function extractTitleFromMarkdown(content: string): string {
	if (!content) return 'Neues Dokument';
	const lines = content.trim().split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('# ')) {
			return trimmed.slice(2).trim();
		}
		if (trimmed.length > 0) {
			return trimmed.length > 100 ? trimmed.slice(0, 100) + '...' : trimmed;
		}
	}
	return 'Neues Dokument';
}

@Injectable()
export class DocumentService {
	constructor(
		@Inject(DATABASE_CONNECTION) private db: Database,
		private spaceService: SpaceService
	) {}

	async findAll(userId: string, spaceId?: string): Promise<Document[]> {
		const conditions = [eq(documents.userId, userId)];
		if (spaceId) {
			conditions.push(eq(documents.spaceId, spaceId));
		}

		return this.db
			.select()
			.from(documents)
			.where(and(...conditions))
			.orderBy(desc(documents.pinned), desc(documents.updatedAt));
	}

	async findAllWithPreview(userId: string, spaceId?: string, limit = 50): Promise<Document[]> {
		const docs = await this.findAll(userId, spaceId);
		return docs.slice(0, limit).map((doc) => ({
			...doc,
			content:
				doc.content && doc.content.length > 200
					? `${doc.content.substring(0, 200)}...`
					: doc.content,
		}));
	}

	async findRecent(userId: string, limit = 5): Promise<Document[]> {
		return this.db
			.select()
			.from(documents)
			.where(eq(documents.userId, userId))
			.orderBy(desc(documents.updatedAt))
			.limit(limit);
	}

	async findById(id: string, userId: string): Promise<Document | null> {
		const result = await this.db
			.select()
			.from(documents)
			.where(and(eq(documents.id, id), eq(documents.userId, userId)));
		return result[0] || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Document> {
		const doc = await this.findById(id, userId);
		if (!doc) {
			throw new NotFoundException(`Document with id ${id} not found`);
		}
		return doc;
	}

	async create(
		userId: string,
		data: {
			content: string;
			type: 'text' | 'context' | 'prompt';
			spaceId?: string;
			title?: string;
			metadata?: Record<string, unknown>;
		}
	): Promise<Document> {
		const title = data.title || extractTitleFromMarkdown(data.content);
		const wordCount = countWords(data.content);
		const tokenCount = estimateTokens(data.content);

		const metadata: DocumentMetadata = {
			...(data.metadata as DocumentMetadata),
			word_count: wordCount,
			token_count: tokenCount,
		};

		// Generate short_id
		let shortId = `DOC-${Math.random().toString(36).substring(2, 8)}`;

		if (data.spaceId) {
			const { counter, prefix } = await this.spaceService.incrementDocCounter(
				data.spaceId,
				data.type
			);
			if (prefix && counter > 0) {
				const typeChar = data.type === 'text' ? 'D' : data.type === 'context' ? 'C' : 'P';
				shortId = `${prefix}${typeChar}${counter}`;
			}
		}

		const newDoc: NewDocument = {
			userId,
			spaceId: data.spaceId || null,
			title,
			content: data.content,
			type: data.type,
			shortId,
			metadata,
		};

		const [created] = await this.db.insert(documents).values(newDoc).returning();
		return created;
	}

	async update(id: string, userId: string, data: Record<string, unknown>): Promise<Document> {
		const existing = await this.findByIdOrThrow(id, userId);

		const updateData: Record<string, unknown> = { updatedAt: new Date() };

		if (data.title !== undefined) updateData.title = data.title;
		if (data.content !== undefined) {
			updateData.content = data.content;
			const wordCount = countWords(data.content as string);
			const tokenCount = estimateTokens(data.content as string);
			updateData.metadata = {
				...(existing.metadata || {}),
				...((data.metadata as object) || {}),
				word_count: wordCount,
				token_count: tokenCount,
			};
		} else if (data.metadata !== undefined) {
			updateData.metadata = { ...(existing.metadata || {}), ...(data.metadata as object) };
		}

		if (data.type !== undefined) {
			updateData.type = data.type;
			// Update short_id type char if type changes
			if (existing.shortId && existing.spaceId && /^[A-Z][CDP]\d+$/.test(existing.shortId)) {
				const spacePrefix = existing.shortId.charAt(0);
				const number = existing.shortId.substring(2);
				const newTypeChar = data.type === 'text' ? 'D' : data.type === 'context' ? 'C' : 'P';
				updateData.shortId = `${spacePrefix}${newTypeChar}${number}`;
			}
		}

		if (data.pinned !== undefined) updateData.pinned = data.pinned;

		const [updated] = await this.db
			.update(documents)
			.set(updateData)
			.where(and(eq(documents.id, id), eq(documents.userId, userId)))
			.returning();

		return updated;
	}

	async updateTags(id: string, userId: string, tags: string[]): Promise<Document> {
		const existing = await this.findByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(documents)
			.set({
				metadata: { ...(existing.metadata || {}), tags },
				updatedAt: new Date(),
			})
			.where(and(eq(documents.id, id), eq(documents.userId, userId)))
			.returning();

		return updated;
	}

	async togglePinned(id: string, userId: string, pinned: boolean): Promise<Document> {
		await this.findByIdOrThrow(id, userId);

		const [updated] = await this.db
			.update(documents)
			.set({ pinned, updatedAt: new Date() })
			.where(and(eq(documents.id, id), eq(documents.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId)));
	}

	async getVersions(id: string, userId: string): Promise<Document[]> {
		const original = await this.findByIdOrThrow(id, userId);

		const isVersion = original.metadata?.parent_document && original.metadata?.version;
		const rootDocumentId = isVersion ? (original.metadata!.parent_document as string) : id;

		const versions = await this.db
			.select()
			.from(documents)
			.where(
				and(
					eq(documents.userId, userId),
					or(
						eq(documents.id, rootDocumentId),
						sql`${documents.metadata}->>'parent_document' = ${rootDocumentId}`
					)
				)
			);

		return versions.sort((a, b) => {
			if (a.id === rootDocumentId) return -1;
			if (b.id === rootDocumentId) return 1;
			return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
		});
	}

	async createVersion(
		originalDocumentId: string,
		userId: string,
		data: {
			content: string;
			generationType: 'summary' | 'continuation' | 'rewrite' | 'ideas';
			model: string;
			prompt: string;
		}
	): Promise<Document> {
		const original = await this.findByIdOrThrow(originalDocumentId, userId);

		const titlePrefixes: Record<string, string> = {
			summary: 'Zusammenfassung',
			continuation: 'Fortsetzung',
			rewrite: 'Umformulierung',
			ideas: 'Ideen zu',
		};

		const title = `${titlePrefixes[data.generationType] || 'KI-Version'}: ${original.title}`;
		const wordCount = countWords(data.content);

		const metadata: DocumentMetadata = {
			parent_document: originalDocumentId,
			original_title: original.title,
			generation_type: data.generationType,
			model_used: data.model,
			prompt_used: data.prompt,
			version: 1,
			version_history: [
				{
					id: originalDocumentId,
					title: original.title,
					type: original.type,
					created_at: original.createdAt.toISOString(),
					is_original: true,
				},
			],
			word_count: wordCount,
		};

		const newDoc: NewDocument = {
			userId,
			spaceId: original.spaceId,
			title,
			content: data.content,
			type: 'text',
			metadata,
		};

		const [created] = await this.db.insert(documents).values(newDoc).returning();
		return created;
	}
}
