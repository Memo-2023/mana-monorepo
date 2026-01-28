import { Injectable, Inject, Logger } from '@nestjs/common';
import { eq, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { projects, projectItems } from '../database/schema';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from '../database/schema';

type Database = PostgresJsDatabase<typeof schema>;

interface CreateProjectInput {
	matrixUserId: string;
	name: string;
}

@Injectable()
export class ProjectService {
	private readonly logger = new Logger(ProjectService.name);

	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async create(input: CreateProjectInput) {
		const [project] = await this.db
			.insert(projects)
			.values({
				matrixUserId: input.matrixUserId,
				name: input.name,
			})
			.returning();

		this.logger.log(`Created project ${project.id} for user ${input.matrixUserId}`);
		return project;
	}

	async findById(id: string) {
		const [project] = await this.db.select().from(projects).where(eq(projects.id, id));
		return project;
	}

	async findByUser(matrixUserId: string) {
		return this.db
			.select()
			.from(projects)
			.where(eq(projects.matrixUserId, matrixUserId))
			.orderBy(desc(projects.createdAt));
	}

	async update(id: string, data: Partial<typeof projects.$inferInsert>) {
		const [project] = await this.db
			.update(projects)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(projects.id, id))
			.returning();
		return project;
	}

	async getStats(projectId: string) {
		const items = await this.db.select().from(projectItems).where(eq(projectItems.projectId, projectId));

		return {
			photos: items.filter((i) => i.type === 'photo').length,
			voices: items.filter((i) => i.type === 'voice').length,
			texts: items.filter((i) => i.type === 'text').length,
			total: items.length,
		};
	}

	async getItems(projectId: string) {
		return this.db
			.select()
			.from(projectItems)
			.where(eq(projectItems.projectId, projectId))
			.orderBy(projectItems.createdAt);
	}
}
