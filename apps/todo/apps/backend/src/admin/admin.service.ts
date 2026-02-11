import { Injectable, Logger } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, desc, inArray } from 'drizzle-orm';
import * as schema from '../db/schema';
import {
	UserDataResponse,
	DeleteUserDataResponse,
	EntityCount,
} from './dto/user-data-response.dto';

@Injectable()
export class AdminService {
	private readonly logger = new Logger(AdminService.name);

	constructor(
		@Inject('DATABASE_CONNECTION')
		private readonly db: NodePgDatabase<typeof schema>
	) {}

	/**
	 * Get user data counts for a specific user
	 */
	async getUserData(userId: string): Promise<UserDataResponse> {
		this.logger.log(`Getting user data for userId: ${userId}`);

		// Count projects
		const projectsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.projects)
			.where(eq(schema.projects.userId, userId));
		const projectsCount = projectsResult[0]?.count ?? 0;

		// Count tasks
		const tasksResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.tasks)
			.where(eq(schema.tasks.userId, userId));
		const tasksCount = tasksResult[0]?.count ?? 0;

		// Count labels
		const labelsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.labels)
			.where(eq(schema.labels.userId, userId));
		const labelsCount = labelsResult[0]?.count ?? 0;

		// Count reminders
		const remindersResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.reminders)
			.where(eq(schema.reminders.userId, userId));
		const remindersCount = remindersResult[0]?.count ?? 0;

		// Count kanban boards
		const kanbanBoardsResult = await this.db
			.select({ count: sql<number>`count(*)::int` })
			.from(schema.kanbanBoards)
			.where(eq(schema.kanbanBoards.userId, userId));
		const kanbanBoardsCount = kanbanBoardsResult[0]?.count ?? 0;

		// Get last activity (most recent task update)
		const lastTask = await this.db
			.select({ updatedAt: schema.tasks.updatedAt })
			.from(schema.tasks)
			.where(eq(schema.tasks.userId, userId))
			.orderBy(desc(schema.tasks.updatedAt))
			.limit(1);
		const lastActivityAt = lastTask[0]?.updatedAt?.toISOString();

		const entities: EntityCount[] = [
			{ entity: 'projects', count: projectsCount, label: 'Projects' },
			{ entity: 'tasks', count: tasksCount, label: 'Tasks' },
			{ entity: 'labels', count: labelsCount, label: 'Labels' },
			{ entity: 'reminders', count: remindersCount, label: 'Reminders' },
			{ entity: 'kanban_boards', count: kanbanBoardsCount, label: 'Kanban Boards' },
		];

		const totalCount =
			projectsCount + tasksCount + labelsCount + remindersCount + kanbanBoardsCount;

		return {
			entities,
			totalCount,
			lastActivityAt,
		};
	}

	/**
	 * Delete all user data (GDPR right to be forgotten)
	 */
	async deleteUserData(userId: string): Promise<DeleteUserDataResponse> {
		this.logger.log(`Deleting user data for userId: ${userId}`);

		const deletedCounts: EntityCount[] = [];
		let totalDeleted = 0;

		// Delete reminders first (FK to tasks)
		const deletedReminders = await this.db
			.delete(schema.reminders)
			.where(eq(schema.reminders.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'reminders',
			count: deletedReminders.length,
			label: 'Reminders',
		});
		totalDeleted += deletedReminders.length;

		// Delete task_labels (through tasks owned by user)
		const userTasks = await this.db
			.select({ id: schema.tasks.id })
			.from(schema.tasks)
			.where(eq(schema.tasks.userId, userId));
		const taskIds = userTasks.map((t) => t.id);

		if (taskIds.length > 0) {
			const deletedTaskLabels = await this.db
				.delete(schema.taskLabels)
				.where(inArray(schema.taskLabels.taskId, taskIds))
				.returning();
			deletedCounts.push({
				entity: 'task_labels',
				count: deletedTaskLabels.length,
				label: 'Task Labels',
			});
			totalDeleted += deletedTaskLabels.length;
		}

		// Delete labels
		const deletedLabels = await this.db
			.delete(schema.labels)
			.where(eq(schema.labels.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'labels',
			count: deletedLabels.length,
			label: 'Labels',
		});
		totalDeleted += deletedLabels.length;

		// Delete tasks
		const deletedTasks = await this.db
			.delete(schema.tasks)
			.where(eq(schema.tasks.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'tasks',
			count: deletedTasks.length,
			label: 'Tasks',
		});
		totalDeleted += deletedTasks.length;

		// Delete kanban columns (through boards owned by user)
		const userBoards = await this.db
			.select({ id: schema.kanbanBoards.id })
			.from(schema.kanbanBoards)
			.where(eq(schema.kanbanBoards.userId, userId));
		const boardIds = userBoards.map((b) => b.id);

		if (boardIds.length > 0) {
			const deletedColumns = await this.db
				.delete(schema.kanbanColumns)
				.where(inArray(schema.kanbanColumns.boardId, boardIds))
				.returning();
			deletedCounts.push({
				entity: 'kanban_columns',
				count: deletedColumns.length,
				label: 'Kanban Columns',
			});
			totalDeleted += deletedColumns.length;
		}

		// Delete kanban boards
		const deletedBoards = await this.db
			.delete(schema.kanbanBoards)
			.where(eq(schema.kanbanBoards.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'kanban_boards',
			count: deletedBoards.length,
			label: 'Kanban Boards',
		});
		totalDeleted += deletedBoards.length;

		// Delete projects
		const deletedProjects = await this.db
			.delete(schema.projects)
			.where(eq(schema.projects.userId, userId))
			.returning();
		deletedCounts.push({
			entity: 'projects',
			count: deletedProjects.length,
			label: 'Projects',
		});
		totalDeleted += deletedProjects.length;

		this.logger.log(`Deleted ${totalDeleted} records for userId: ${userId}`);

		return {
			success: true,
			deletedCounts,
			totalDeleted,
		};
	}
}
