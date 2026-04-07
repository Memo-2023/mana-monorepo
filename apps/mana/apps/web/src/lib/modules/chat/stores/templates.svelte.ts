/**
 * Templates Store — Mutations Only
 *
 * Reads come from liveQuery hooks in queries.ts.
 * This store handles template CRUD in IndexedDB.
 */

import { chatTemplateTable } from '../collections';
import { toTemplate } from '../queries';
import { encryptRecord } from '$lib/data/crypto';
import type { LocalTemplate } from '../types';

export const templatesStore = {
	/** Create a new template. */
	async create(data: {
		name: string;
		description?: string;
		systemPrompt: string;
		initialQuestion?: string;
		modelId?: string;
		color: string;
		isDefault?: boolean;
		documentMode?: boolean;
	}) {
		const newLocal: LocalTemplate = {
			id: crypto.randomUUID(),
			name: data.name,
			description: data.description ?? '',
			systemPrompt: data.systemPrompt,
			initialQuestion: data.initialQuestion ?? null,
			modelId: data.modelId ?? null,
			color: data.color,
			isDefault: data.isDefault ?? false,
			documentMode: data.documentMode ?? false,
		};
		const plaintextSnapshot = toTemplate(newLocal);
		await encryptRecord('chatTemplates', newLocal);
		await chatTemplateTable.add(newLocal);
		return plaintextSnapshot;
	},

	/** Update a template. */
	async update(
		id: string,
		data: Partial<
			Pick<
				LocalTemplate,
				| 'name'
				| 'description'
				| 'systemPrompt'
				| 'initialQuestion'
				| 'modelId'
				| 'color'
				| 'isDefault'
				| 'documentMode'
			>
		>
	) {
		const diff: Partial<LocalTemplate> = {
			...data,
			updatedAt: new Date().toISOString(),
		};
		await encryptRecord('chatTemplates', diff);
		await chatTemplateTable.update(id, diff);
	},

	/** Soft-delete a template. */
	async delete(id: string) {
		const now = new Date().toISOString();
		await chatTemplateTable.update(id, { deletedAt: now, updatedAt: now });
	},

	/** Set a template as default (unset all others). */
	async setDefault(templateId: string) {
		const all = await chatTemplateTable.toArray();
		for (const t of all) {
			if (t.isDefault && t.id !== templateId) {
				await chatTemplateTable.update(t.id, {
					isDefault: false,
					updatedAt: new Date().toISOString(),
				});
			}
		}
		await chatTemplateTable.update(templateId, {
			isDefault: true,
			updatedAt: new Date().toISOString(),
		});
	},
};
