/**
 * Projects Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles project CRUD.
 */

import { mukkeProjectTable } from '../collections';
import { toProject } from '../queries';
import { MukkeEvents } from '@manacore/shared-utils/analytics';
import type { LocalProject } from '../types';

export const projectsStore = {
	/** Create a new project. */
	async create(data: { title: string; description?: string; songId?: string }) {
		const newLocal: LocalProject = {
			id: crypto.randomUUID(),
			title: data.title,
			description: data.description ?? null,
			songId: data.songId ?? null,
		};
		await mukkeProjectTable.add(newLocal);
		MukkeEvents.projectCreated();
		return toProject(newLocal);
	},

	/** Update a project. */
	async update(id: string, data: Partial<Pick<LocalProject, 'title' | 'description' | 'songId'>>) {
		await mukkeProjectTable.update(id, {
			...data,
			updatedAt: new Date().toISOString(),
		});
	},

	/** Soft-delete a project. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await mukkeProjectTable.update(id, { deletedAt: now, updatedAt: now });
		MukkeEvents.projectDeleted();
	},
};
