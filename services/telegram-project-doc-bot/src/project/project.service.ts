import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DATABASE_CONNECTION } from '../database/database.module';
import * as schema from '../database/schema';
import { Project, NewProject } from '../database/schema';

@Injectable()
export class ProjectService {
	private readonly logger = new Logger(ProjectService.name);

	constructor(
		@Inject(DATABASE_CONNECTION)
		private db: PostgresJsDatabase<typeof schema>
	) {}

	async create(data: {
		telegramUserId: number;
		name: string;
		description?: string;
	}): Promise<Project> {
		const [project] = await this.db
			.insert(schema.projects)
			.values({
				telegramUserId: data.telegramUserId,
				name: data.name,
				description: data.description,
			})
			.returning();

		this.logger.log(`Created project "${project.name}" for user ${data.telegramUserId}`);
		return project;
	}

	async findById(id: string): Promise<Project | undefined> {
		return this.db.query.projects.findFirst({
			where: eq(schema.projects.id, id),
		});
	}

	async findByUser(telegramUserId: number): Promise<Project[]> {
		return this.db.query.projects.findMany({
			where: eq(schema.projects.telegramUserId, telegramUserId),
			orderBy: [desc(schema.projects.updatedAt)],
		});
	}

	async findActiveByUser(telegramUserId: number): Promise<Project[]> {
		return this.db.query.projects.findMany({
			where: and(
				eq(schema.projects.telegramUserId, telegramUserId),
				eq(schema.projects.status, 'active')
			),
			orderBy: [desc(schema.projects.updatedAt)],
		});
	}

	async update(id: string, data: Partial<NewProject>): Promise<Project | undefined> {
		const [project] = await this.db
			.update(schema.projects)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(schema.projects.id, id))
			.returning();

		return project;
	}

	async delete(id: string): Promise<boolean> {
		const result = await this.db.delete(schema.projects).where(eq(schema.projects.id, id));
		return (result as unknown as { rowCount: number }).rowCount > 0;
	}

	async getStats(projectId: string): Promise<{
		photos: number;
		voices: number;
		texts: number;
		total: number;
	}> {
		const items = await this.db.query.mediaItems.findMany({
			where: eq(schema.mediaItems.projectId, projectId),
		});

		return {
			photos: items.filter((i) => i.type === 'photo').length,
			voices: items.filter((i) => i.type === 'voice').length,
			texts: items.filter((i) => i.type === 'text').length,
			total: items.length,
		};
	}
}
