/**
 * Templates Store — Mutation-Only Service
 *
 * All reads are handled by useLiveQuery() hooks in data/queries.ts.
 * This store only provides write operations (create, update, delete).
 * IndexedDB writes automatically trigger UI updates via Dexie liveQuery.
 */

import { templateCollection, type LocalTemplate } from '$lib/data/local-store';
import { toTemplate } from '$lib/data/queries';
import type { Template, TemplateCreate, TemplateUpdate } from '@chat/types';

let error = $state<string | null>(null);

export const templatesStore = {
	get error() {
		return error;
	},

	/**
	 * Create a new template
	 */
	async createTemplate(template: TemplateCreate): Promise<Template | null> {
		error = null;
		try {
			const newLocal: LocalTemplate = {
				id: crypto.randomUUID(),
				name: template.name,
				description: template.description ?? '',
				systemPrompt: template.systemPrompt,
				initialQuestion: template.initialQuestion,
				modelId: template.modelId,
				color: template.color,
				isDefault: template.isDefault,
				documentMode: template.documentMode,
			};
			const inserted = await templateCollection.insert(newLocal);
			return toTemplate(inserted);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create template';
			return null;
		}
	},

	/**
	 * Update a template
	 */
	async updateTemplate(templateId: string, updates: TemplateUpdate): Promise<boolean> {
		error = null;
		try {
			await templateCollection.update(templateId, updates as Partial<LocalTemplate>);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to update template';
			return false;
		}
	},

	/**
	 * Delete a template
	 */
	async deleteTemplate(templateId: string): Promise<boolean> {
		error = null;
		try {
			await templateCollection.delete(templateId);
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to delete template';
			return false;
		}
	},

	/**
	 * Set a template as default (unset all others)
	 */
	async setDefaultTemplate(templateId: string): Promise<boolean> {
		error = null;
		try {
			// Unset all current defaults
			const all = await templateCollection.getAll({ isDefault: true });
			for (const t of all) {
				if (t.id !== templateId) {
					await templateCollection.update(t.id, { isDefault: false });
				}
			}
			// Set the new default
			await templateCollection.update(templateId, { isDefault: true });
			return true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to set default template';
			return false;
		}
	},

	/**
	 * Reset error state
	 */
	reset() {
		error = null;
	},
};
