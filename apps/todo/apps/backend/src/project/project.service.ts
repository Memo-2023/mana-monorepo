import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, asc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { projects, type Project, type NewProject } from '../db/schema';
import { CreateProjectDto, UpdateProjectDto } from './dto';

@Injectable()
export class ProjectService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async findAll(userId: string): Promise<Project[]> {
		return this.db.query.projects.findMany({
			where: eq(projects.userId, userId),
			orderBy: [asc(projects.order), asc(projects.createdAt)],
		});
	}

	async findById(id: string, userId: string): Promise<Project | null> {
		const result = await this.db.query.projects.findFirst({
			where: and(eq(projects.id, id), eq(projects.userId, userId)),
		});
		return result ?? null;
	}

	async findByIdOrThrow(id: string, userId: string): Promise<Project> {
		const project = await this.findById(id, userId);
		if (!project) {
			throw new NotFoundException(`Project with id ${id} not found`);
		}
		return project;
	}

	async create(userId: string, dto: CreateProjectDto): Promise<Project> {
		// Get the highest order value
		const existingProjects = await this.findAll(userId);
		const maxOrder = existingProjects.reduce((max, p) => Math.max(max, p.order ?? 0), -1);

		// If this is the first project, make it default
		const isDefault = dto.isDefault ?? existingProjects.length === 0;

		// If this project is default, clear other defaults
		if (isDefault) {
			await this.clearDefaultProject(userId);
		}

		const newProject: NewProject = {
			userId,
			name: dto.name,
			description: dto.description,
			color: dto.color ?? '#3B82F6',
			icon: dto.icon,
			order: maxOrder + 1,
			isDefault,
			settings: dto.settings,
		};

		const [created] = await this.db.insert(projects).values(newProject).returning();
		return created;
	}

	async update(id: string, userId: string, dto: UpdateProjectDto): Promise<Project> {
		await this.findByIdOrThrow(id, userId);

		// If setting as default, clear other defaults first
		if (dto.isDefault) {
			await this.clearDefaultProject(userId);
		}

		const [updated] = await this.db
			.update(projects)
			.set({
				...dto,
				updatedAt: new Date(),
			})
			.where(and(eq(projects.id, id), eq(projects.userId, userId)))
			.returning();

		return updated;
	}

	async delete(id: string, userId: string): Promise<void> {
		const project = await this.findByIdOrThrow(id, userId);

		// Don't allow deleting the default inbox project
		if (project.isDefault) {
			throw new NotFoundException('Cannot delete the default inbox project');
		}

		await this.db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
	}

	async archive(id: string, userId: string): Promise<Project> {
		return this.update(id, userId, { isArchived: true });
	}

	async unarchive(id: string, userId: string): Promise<Project> {
		return this.update(id, userId, { isArchived: false });
	}

	async reorder(userId: string, projectIds: string[]): Promise<Project[]> {
		// Update order for each project
		const updates = projectIds.map((id, index) =>
			this.db
				.update(projects)
				.set({ order: index, updatedAt: new Date() })
				.where(and(eq(projects.id, id), eq(projects.userId, userId)))
		);

		await Promise.all(updates);

		return this.findAll(userId);
	}

	async getOrCreateDefaultProject(userId: string): Promise<Project> {
		// Try to find existing default project
		const defaultProject = await this.db.query.projects.findFirst({
			where: and(eq(projects.userId, userId), eq(projects.isDefault, true)),
		});

		if (defaultProject) {
			return defaultProject;
		}

		// Create default inbox project
		return this.create(userId, {
			name: 'Inbox',
			color: '#6B7280',
			icon: 'inbox',
			isDefault: true,
		});
	}

	private async clearDefaultProject(userId: string): Promise<void> {
		await this.db
			.update(projects)
			.set({ isDefault: false, updatedAt: new Date() })
			.where(and(eq(projects.userId, userId), eq(projects.isDefault, true)));
	}
}
