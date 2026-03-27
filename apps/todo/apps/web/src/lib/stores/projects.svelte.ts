/**
 * Projects Store — Local-First with Dexie.js
 *
 * All reads and writes go to IndexedDB first.
 * Same public API as before so components don't need changes.
 */

import type { Project } from '@todo/shared';
import { projectCollection, type LocalProject } from '$lib/data/local-store';
import { TodoEvents } from '@manacore/shared-utils/analytics';

// State
let projects = $state<Project[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

/** Convert a LocalProject (IndexedDB) to the shared Project type. */
function toProject(local: LocalProject): Project {
	return {
		id: local.id,
		userId: local.userId ?? 'guest',
		name: local.name,
		color: local.color,
		icon: local.icon,
		order: local.order,
		isArchived: local.isArchived,
		isDefault: local.isDefault,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

export const projectsStore = {
	get projects() {
		return projects;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	get inboxProject() {
		return projects.find((p) => p.isDefault);
	},

	get activeProjects() {
		return projects.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order);
	},

	get archivedProjects() {
		return projects.filter((p) => p.isArchived);
	},

	/**
	 * Load projects from IndexedDB.
	 */
	async fetchProjects() {
		loading = true;
		error = null;
		try {
			const localProjects = await projectCollection.getAll(undefined, {
				sortBy: 'order',
				sortDirection: 'asc',
			});
			projects = localProjects.map(toProject);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch projects';
			console.error('Failed to fetch projects:', e);
		} finally {
			loading = false;
		}
	},

	getById(id: string): Project | undefined {
		return projects.find((p) => p.id === id);
	},

	getColor(projectId: string): string {
		const project = projects.find((p) => p.id === projectId);
		return project?.color || '#6b7280';
	},

	async createProject(data: { name: string; description?: string; color?: string; icon?: string }) {
		loading = true;
		error = null;
		try {
			const newLocal: LocalProject = {
				id: crypto.randomUUID(),
				name: data.name,
				color: data.color ?? '#6b7280',
				icon: data.icon ?? null,
				order: projects.length,
				isArchived: false,
				isDefault: false,
			};

			const inserted = await projectCollection.insert(newLocal);
			const newProject = toProject(inserted);
			projects = [...projects, newProject];
			TodoEvents.projectCreated();
			return newProject;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create project';
			console.error('Failed to create project:', e);
			throw e;
		} finally {
			loading = false;
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
				const updatedProject = toProject(updated);
				projects = projects.map((p) => (p.id === id ? updatedProject : p));
				return updatedProject;
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
			projects = projects.filter((p) => p.id !== id);
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
				const archivedProject = toProject(updated);
				projects = projects.map((p) => (p.id === id ? archivedProject : p));
				return archivedProject;
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
			projects = projects.map((p) => {
				const newOrder = projectIds.indexOf(p.id);
				return newOrder !== -1 ? { ...p, order: newOrder } : p;
			});

			for (let i = 0; i < projectIds.length; i++) {
				await projectCollection.update(projectIds[i], { order: i } as Partial<LocalProject>);
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder projects';
			console.error('Failed to reorder projects:', e);
			throw e;
		}
	},

	clear() {
		projects = [];
		loading = false;
		error = null;
	},

	isGuestInbox(_id: string) {
		return false;
	},

	get guestInboxId() {
		return 'personal-project';
	},
};
