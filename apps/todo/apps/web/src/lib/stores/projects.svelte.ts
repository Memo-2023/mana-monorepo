/**
 * Projects Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in task-queries.ts.
 * This store only provides write operations (create, update, delete, etc.).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import type { Project } from '@todo/shared';
import { projectCollection, type LocalProject } from '$lib/data/local-store';
import { toProject } from '$lib/data/task-queries';
import { TodoEvents } from '@manacore/shared-utils/analytics';
import { withErrorHandling } from './store-helpers';

let error = $state<string | null>(null);
const setError = (e: string | null) => (error = e);

export const projectsStore = {
	get error() {
		return error;
	},

	async createProject(data: { name: string; description?: string; color?: string; icon?: string }) {
		return withErrorHandling(
			setError,
			async () => {
				const count = await projectCollection.count();
				const newLocal: LocalProject = {
					id: crypto.randomUUID(),
					name: data.name,
					color: data.color ?? '#6b7280',
					icon: data.icon ?? null,
					order: count,
					isArchived: false,
					isDefault: false,
				};

				const inserted = await projectCollection.insert(newLocal);
				TodoEvents.projectCreated();
				return toProject(inserted);
			},
			'Failed to create project'
		);
	},

	async updateProject(
		id: string,
		data: { name?: string; description?: string; color?: string; icon?: string }
	) {
		return withErrorHandling(
			setError,
			async () => {
				const updated = await projectCollection.update(id, data as Partial<LocalProject>);
				if (updated) {
					return toProject(updated);
				}
			},
			'Failed to update project'
		);
	},

	async deleteProject(id: string) {
		return withErrorHandling(
			setError,
			async () => {
				await projectCollection.delete(id);
				TodoEvents.projectDeleted();
			},
			'Failed to delete project'
		);
	},

	async archiveProject(id: string) {
		return withErrorHandling(
			setError,
			async () => {
				const updated = await projectCollection.update(id, {
					isArchived: true,
				} as Partial<LocalProject>);
				if (updated) {
					return toProject(updated);
				}
			},
			'Failed to archive project'
		);
	},

	async reorderProjects(projectIds: string[]) {
		return withErrorHandling(
			setError,
			async () => {
				for (let i = 0; i < projectIds.length; i++) {
					await projectCollection.update(projectIds[i], { order: i } as Partial<LocalProject>);
				}
			},
			'Failed to reorder projects'
		);
	},

	get guestInboxId() {
		return 'personal-project';
	},
};
