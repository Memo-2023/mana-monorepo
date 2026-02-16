import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { lyrics, lyricLines, projects } from '../db/schema';
import type { Lyrics, NewLyrics, LyricLine, NewLyricLine } from '../db/schema';

@Injectable()
export class LyricsService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async verifyProjectOwnership(projectId: string, userId: string): Promise<void> {
		const [project] = await this.db
			.select()
			.from(projects)
			.where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
		if (!project) {
			throw new NotFoundException('Project not found');
		}
	}

	async findByProjectId(projectId: string): Promise<Lyrics | null> {
		const [lyricsRecord] = await this.db
			.select()
			.from(lyrics)
			.where(eq(lyrics.projectId, projectId));
		return lyricsRecord || null;
	}

	async findById(id: string): Promise<Lyrics | null> {
		const [lyricsRecord] = await this.db.select().from(lyrics).where(eq(lyrics.id, id));
		return lyricsRecord || null;
	}

	async findByIdOrThrow(id: string): Promise<Lyrics> {
		const lyricsRecord = await this.findById(id);
		if (!lyricsRecord) {
			throw new NotFoundException('Lyrics not found');
		}
		return lyricsRecord;
	}

	async createOrUpdate(projectId: string, userId: string, content: string): Promise<Lyrics> {
		await this.verifyProjectOwnership(projectId, userId);

		const existing = await this.findByProjectId(projectId);
		if (existing) {
			const [updated] = await this.db
				.update(lyrics)
				.set({ content })
				.where(eq(lyrics.id, existing.id))
				.returning();
			return updated;
		}

		const [created] = await this.db.insert(lyrics).values({ projectId, content }).returning();
		return created;
	}

	async getLinesForLyrics(lyricsId: string): Promise<LyricLine[]> {
		return this.db
			.select()
			.from(lyricLines)
			.where(eq(lyricLines.lyricsId, lyricsId))
			.orderBy(asc(lyricLines.lineNumber));
	}

	async syncLines(
		lyricsId: string,
		userId: string,
		lines: Array<{
			lineNumber: number;
			text: string;
			startTime?: number;
			endTime?: number;
		}>
	): Promise<LyricLine[]> {
		const lyricsRecord = await this.findByIdOrThrow(lyricsId);
		await this.verifyProjectOwnership(lyricsRecord.projectId, userId);

		// Delete existing lines
		await this.db.delete(lyricLines).where(eq(lyricLines.lyricsId, lyricsId));

		if (lines.length === 0) return [];

		// Insert new lines
		const values: NewLyricLine[] = lines.map((line) => ({
			lyricsId,
			lineNumber: line.lineNumber,
			text: line.text,
			startTime: line.startTime,
			endTime: line.endTime,
		}));

		return this.db.insert(lyricLines).values(values).returning();
	}

	async updateLineTimestamp(
		lineId: string,
		userId: string,
		data: { startTime?: number; endTime?: number }
	): Promise<LyricLine> {
		const [line] = await this.db.select().from(lyricLines).where(eq(lyricLines.id, lineId));
		if (!line) {
			throw new NotFoundException('Lyric line not found');
		}

		const lyricsRecord = await this.findByIdOrThrow(line.lyricsId);
		await this.verifyProjectOwnership(lyricsRecord.projectId, userId);

		const [updated] = await this.db
			.update(lyricLines)
			.set(data)
			.where(eq(lyricLines.id, lineId))
			.returning();
		return updated;
	}

	async getWithLines(projectId: string, userId: string) {
		await this.verifyProjectOwnership(projectId, userId);

		const lyricsRecord = await this.findByProjectId(projectId);
		if (!lyricsRecord) {
			return null;
		}

		const lines = await this.getLinesForLyrics(lyricsRecord.id);
		return {
			...lyricsRecord,
			lines,
		};
	}
}
