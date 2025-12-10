import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { tasks, labels, taskLabels, projects } from '../db/schema';

export interface NetworkNode {
	id: string;
	name: string;
	photoUrl: string | null;
	company: string | null; // Project name as subtitle
	isFavorite: boolean;
	tags: { id: string; name: string; color: string | null }[];
	connectionCount: number;
}

export interface NetworkLink {
	source: string;
	target: string;
	type: 'tag';
	strength: number;
	sharedTags: string[];
}

export interface NetworkGraphResponse {
	nodes: NetworkNode[];
	links: NetworkLink[];
}

@Injectable()
export class NetworkService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	/**
	 * Build a network graph of tasks connected by shared labels
	 */
	async getGraph(userId: string): Promise<NetworkGraphResponse> {
		// 1. Get all tasks for user
		const userTasks = await this.db
			.select({
				task: tasks,
			})
			.from(tasks)
			.where(eq(tasks.userId, userId));

		// 2. Get all projects for this user (for project names)
		const userProjects = await this.db
			.select({
				id: projects.id,
				name: projects.name,
			})
			.from(projects)
			.where(eq(projects.userId, userId));

		const projectMap = new Map(userProjects.map((p) => [p.id, p.name]));

		// 3. Get labels for each task
		const taskLabelsMap = new Map<string, { id: string; name: string; color: string | null }[]>();

		for (const { task } of userTasks) {
			const taskLabelRows = await this.db
				.select({
					id: labels.id,
					name: labels.name,
					color: labels.color,
				})
				.from(taskLabels)
				.innerJoin(labels, eq(taskLabels.labelId, labels.id))
				.where(eq(taskLabels.taskId, task.id));

			taskLabelsMap.set(task.id, taskLabelRows);
		}

		// 4. Filter tasks that have at least one label
		const tasksWithLabels = userTasks.filter((t) => {
			const lbls = taskLabelsMap.get(t.task.id) || [];
			return lbls.length > 0;
		});

		// 5. Build nodes
		const nodes: NetworkNode[] = tasksWithLabels.map(({ task }) => {
			const lbls = taskLabelsMap.get(task.id) || [];
			const projectName = task.projectId ? projectMap.get(task.projectId) || null : null;
			return {
				id: task.id,
				name: task.title,
				photoUrl: null, // Tasks don't have photos
				company: projectName, // Use project name as subtitle
				isFavorite: false,
				tags: lbls,
				connectionCount: 0, // Will be calculated below
			};
		});

		// 6. Build links based on shared labels
		const links: NetworkLink[] = [];
		const connectionCounts = new Map<string, number>();

		for (let i = 0; i < nodes.length; i++) {
			for (let j = i + 1; j < nodes.length; j++) {
				const node1 = nodes[i];
				const node2 = nodes[j];

				// Find shared labels
				const sharedTags = node1.tags
					.filter((t1) => node2.tags.some((t2) => t2.id === t1.id))
					.map((t) => t.name);

				if (sharedTags.length > 0) {
					// Calculate strength based on number of shared labels
					const maxTags = Math.max(node1.tags.length, node2.tags.length);
					const strength = Math.round((sharedTags.length / maxTags) * 100);

					links.push({
						source: node1.id,
						target: node2.id,
						type: 'tag',
						strength,
						sharedTags,
					});

					// Update connection counts
					connectionCounts.set(node1.id, (connectionCounts.get(node1.id) || 0) + 1);
					connectionCounts.set(node2.id, (connectionCounts.get(node2.id) || 0) + 1);
				}
			}
		}

		// 7. Update connection counts in nodes
		for (const node of nodes) {
			node.connectionCount = connectionCounts.get(node.id) || 0;
		}

		return { nodes, links };
	}
}
