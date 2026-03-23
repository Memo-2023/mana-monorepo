/**
 * Projects Store - Manages project state using Svelte 5 runes
 * Supports both authenticated (cloud) and guest (session) modes
 */

import type { Project } from '@todo/shared';
import * as projectsApi from '$lib/api/projects';
import { authStore } from './auth.svelte';
import { TodoEvents } from '@manacore/shared-utils/analytics';

// Guest inbox project for unauthenticated users
const GUEST_INBOX: Project = {
	id: 'session-inbox',
	userId: 'guest',
	name: 'Inbox',
	color: '#6b7280',
	order: 0,
	isArchived: false,
	isDefault: true,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

// State
let projects = $state<Project[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const projectsStore = {
	// Getters
	get projects() {
		return projects;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},

	/**
	 * Get inbox project (default project)
	 */
	get inboxProject() {
		return projects.find((p) => p.isDefault);
	},

	/**
	 * Get non-archived projects sorted by order
	 */
	get activeProjects() {
		return projects.filter((p) => !p.isArchived).sort((a, b) => a.order - b.order);
	},

	/**
	 * Get archived projects
	 */
	get archivedProjects() {
		return projects.filter((p) => p.isArchived);
	},

	/**
	 * Fetch all projects from API
	 * In guest mode, returns a default inbox project
	 */
	async fetchProjects() {
		loading = true;
		error = null;

		// Guest mode: return local inbox only
		if (!authStore.isAuthenticated) {
			projects = [GUEST_INBOX];
			loading = false;
			return;
		}

		// Authenticated: fetch from API
		try {
			projects = await projectsApi.getProjects();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch projects';
			console.error('Failed to fetch projects:', e);
		} finally {
			loading = false;
		}
	},

	/**
	 * Get project by ID
	 */
	getById(id: string): Project | undefined {
		return projects.find((p) => p.id === id);
	},

	/**
	 * Get project color by ID
	 */
	getColor(projectId: string): string {
		const project = projects.find((p) => p.id === projectId);
		return project?.color || '#6b7280';
	},

	/**
	 * Create a new project
	 */
	async createProject(data: { name: string; description?: string; color?: string; icon?: string }) {
		loading = true;
		error = null;
		try {
			const newProject = await projectsApi.createProject(data);
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

	/**
	 * Update an existing project
	 */
	async updateProject(
		id: string,
		data: { name?: string; description?: string; color?: string; icon?: string }
	) {
		error = null;
		try {
			const updatedProject = await projectsApi.updateProject(id, data);
			projects = projects.map((p) => (p.id === id ? updatedProject : p));
			return updatedProject;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update project';
			console.error('Failed to update project:', e);
			throw e;
		}
	},

	/**
	 * Delete a project
	 */
	async deleteProject(id: string) {
		error = null;
		try {
			await projectsApi.deleteProject(id);
			projects = projects.filter((p) => p.id !== id);
			TodoEvents.projectDeleted();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete project';
			console.error('Failed to delete project:', e);
			throw e;
		}
	},

	/**
	 * Archive a project
	 */
	async archiveProject(id: string) {
		error = null;
		try {
			const archivedProject = await projectsApi.archiveProject(id);
			projects = projects.map((p) => (p.id === id ? archivedProject : p));
			return archivedProject;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to archive project';
			console.error('Failed to archive project:', e);
			throw e;
		}
	},

	/**
	 * Reorder projects
	 */
	async reorderProjects(projectIds: string[]) {
		error = null;
		try {
			await projectsApi.reorderProjects(projectIds);
			// Update local order
			projects = projects.map((p) => {
				const newOrder = projectIds.indexOf(p.id);
				return newOrder !== -1 ? { ...p, order: newOrder } : p;
			});
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to reorder projects';
			console.error('Failed to reorder projects:', e);
			throw e;
		}
	},

	/**
	 * Clear all state (for logout)
	 */
	clear() {
		projects = [];
		loading = false;
		error = null;
	},

	/**
	 * Check if a project ID is the guest inbox
	 */
	isGuestInbox(id: string) {
		return id === GUEST_INBOX.id;
	},

	/**
	 * Get the guest inbox ID
	 */
	get guestInboxId() {
		return GUEST_INBOX.id;
	},
};
