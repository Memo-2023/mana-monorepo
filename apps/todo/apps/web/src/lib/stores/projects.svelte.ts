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

let error = $state<string | null>(null);

export const projectsStore = {
	get error() {
		return error;
	},

	async createProject(data: { name: string; description?: string; color?: string; icon?: string }) {
		error = null;
		try {
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
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create project';
			console.error('Failed to create project:', e);
			throw e;
		}
	},

	async updateProject(
		id: string,
		data: { name?: string; description?: string; color?: string; icon?: string }
	) {
		error = null;
		try {
			const updated = await projectCollection.update(id, data as Partial<LocalProject>);
			if (updated) {
				return toProject(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update project';
			console.error('Failed to update project:', e);
			throw e;
		}
	},

	async deleteProject(id: string) {
		error = null;
		try {
			await projectCollection.delete(id);
			TodoEvents.projectDeleted();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete project';
			console.error('Failed to delete project:', e);
			throw e;
		}
	},

	async archiveProject(id: string) {
		error = null;
		try {
			const updated = await projectCollection.update(id, {
				isArchived: true,
			} as Partial<LocalProject>);
			if (updated) {
				return toProject(updated);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to archive project';
			console.error('Failed to archive project:', e);
			throw e;
		}
	},

	async reorderProjects(projectIds: string[]) {
		error = null;
		try {
			for (let i = 0; i < projectIds.length; i++) {
				await projectCollection.update(projectIds[i], { order: i } as Partial<LocalProject>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder projects';
			console.error('Failed to reorder projects:', e);
			throw e;
		}
	},

	get guestInboxId() {
		return 'personal-project';
	},
};
