/**
 * Playground Snippets Store — Mutation-Only.
 *
 * Reads live in queries.ts. This store only writes. Both `name` and
 * `systemPrompt` are encrypted before hitting Dexie — same pattern as
 * notes/dreams.
 */

import { encryptRecord } from '$lib/data/crypto';
import { playgroundSnippetTable } from '../collections';
import { toSnippet } from '../queries';
import type { LocalPlaygroundSnippet, PlaygroundSnippet } from '../types';

export const playgroundSnippetsStore = {
	async create(input: {
		name: string;
		systemPrompt: string;
		model: string;
		temperature: number;
	}): Promise<PlaygroundSnippet> {
		const now = new Date().toISOString();
		const newLocal: LocalPlaygroundSnippet = {
			id: crypto.randomUUID(),
			name: input.name,
			systemPrompt: input.systemPrompt,
			model: input.model,
			temperature: input.temperature,
			isPinned: false,
			order: Date.now(),
			createdAt: now,
		};

		// Snapshot the plaintext DTO before encryption mutates the record
		// in place — same pattern as places/notes/dreams.
		const plaintextSnapshot = toSnippet({ ...newLocal });
		await encryptRecord('playgroundSnippets', newLocal);
		await playgroundSnippetTable.add(newLocal);
		return plaintextSnapshot;
	},

	async update(
		id: string,
		patch: Partial<Pick<PlaygroundSnippet, 'name' | 'systemPrompt' | 'model' | 'temperature'>>
	): Promise<void> {
		const diff: Partial<LocalPlaygroundSnippet> & Record<string, unknown> = {
			...patch,
		};
		await encryptRecord('playgroundSnippets', diff);
		await playgroundSnippetTable.update(id, diff);
	},

	async togglePin(id: string): Promise<void> {
		const local = await playgroundSnippetTable.get(id);
		if (!local) return;
		await playgroundSnippetTable.update(id, {
			isPinned: !local.isPinned,
		});
	},

	async remove(id: string): Promise<void> {
		const now = new Date().toISOString();
		await playgroundSnippetTable.update(id, {
			deletedAt: now,
		});
	},
};
