/**
 * Projects Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * Handles project CRUD.
 */

import { musicProjectTable } from '../collections';
import { toProject } from '../queries';
import { MusicEvents } from '@mana/shared-utils/analytics';
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
		await musicProjectTable.add(newLocal);
		MusicEvents.projectCreated();
		return toProject(newLocal);
	},

	/** Update a project. */
	async update(id: string, data: Partial<Pick<LocalProject, 'title' | 'description' | 'songId'>>) {
		await musicProjectTable.update(id, {
			...data,
		});
	},

	/** Soft-delete a project. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await musicProjectTable.update(id, { deletedAt: now });
		MusicEvents.projectDeleted();
	},
};
