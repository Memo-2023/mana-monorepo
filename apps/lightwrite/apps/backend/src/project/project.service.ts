import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { projects, beats, lyrics } from '../db/schema';
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
