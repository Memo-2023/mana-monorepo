import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { projects, beats, lyrics, songs } from '../db/schema';
import type { Project, NewProject } from '../db/schema';

@Injectable()
export class ProjectService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findByUserId(userId: string): Promise<Project[]> {
		return this.db
			.select()
			.from(projects)
			.where(eq(projects.userId, userId))
			.orderBy(desc(projects.updatedAt));
	}

	async findById(id: string, userId: string): Promise<Project | null> {
		const [project] = await this.db
			.select()
			.from(projects)
			.where(and(eq(projects.id, id), eq(projects.userId, userId)));
		return project || null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Project> {
		const project = await this.findById(id, userId);
		if (!project) {
			throw new NotFoundException('Project not found');
		}
		return project;
	}

	async create(data: NewProject): Promise<Project> {
		const [project] = await this.db.insert(projects).values(data).returning();
		return project;
	}

	async update(
		id: string,
		userId: string,
		data: Partial<Pick<Project, 'title' | 'description'>>
	): Promise<Project> {
		await this.findByIdOrThrow(id, userId);
		const [project] = await this.db
			.update(projects)
			.set({ ...data, updatedAt: new Date() })
			.where(and(eq(projects.id, id), eq(projects.userId, userId)))
			.returning();
		return project;
	}

	async delete(id: string, userId: string): Promise<void> {
		await this.findByIdOrThrow(id, userId);
		await this.db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
	}

	async createFromSong(songId: string, userId: string): Promise<Project> {
		const [song] = await this.db
			.select()
			.from(songs)
			.where(and(eq(songs.id, songId), eq(songs.userId, userId)));
		if (!song) {
			throw new NotFoundException('Song not found');
		}

		const title = song.artist ? `${song.title} - ${song.artist}` : song.title;

		const project = await this.db.transaction(async (tx) => {
			const [newProject] = await tx.insert(projects).values({ userId, title, songId }).returning();

			// Create a beat record linked to the song's storage
			await tx.insert(beats).values({
				projectId: newProject.id,
				storagePath: song.storagePath,
				filename: `${song.title}.mp3`,
				duration: song.duration,
				bpm: song.bpm,
			});

			return newProject;
		});

		return project;
	}

	async getProjectWithRelations(id: string, userId: string) {
		const project = await this.findByIdOrThrow(id, userId);

		const [projectBeat] = await this.db.select().from(beats).where(eq(beats.projectId, id));

		const [projectLyrics] = await this.db.select().from(lyrics).where(eq(lyrics.projectId, id));

		return {
			...project,
			beat: projectBeat || null,
			lyrics: projectLyrics || null,
		};
	}
}
