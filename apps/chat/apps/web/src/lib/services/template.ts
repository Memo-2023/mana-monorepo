/**
 * Template Service - CRUD operations via Backend API
 */

import { templateApi } from './api';
import type { Template } from './api';

export type { Template };

export const templateService = {
	/**
	 * Get all templates for the current user
	 */
	async getTemplates(userId: string): Promise<Template[]> {
		return templateApi.getTemplates();
	},

	/**
	 * Get a single template by ID
	 */
	async getTemplate(templateId: string): Promise<Template | null> {
		return templateApi.getTemplate(templateId);
	},

	/**
	 * Get the default template for the current user
	 */
	async getDefaultTemplate(userId: string): Promise<Template | null> {
		return templateApi.getDefaultTemplate();
	},

	/**
	 * Create a new template
	 */
	async createTemplate(template: {
		userId: string;
		name: string;
		description?: string;
		systemPrompt: string;
		initialQuestion?: string;
		modelId?: string;
		color?: string;
		documentMode?: boolean;
	}): Promise<Template | null> {
		return templateApi.createTemplate({
			name: template.name,
			description: template.description,
			systemPrompt: template.systemPrompt,
			initialQuestion: template.initialQuestion,
			modelId: template.modelId,
			color: template.color,
			documentMode: template.documentMode,
		});
	},

	/**
	 * Update an existing template
	 */
	async updateTemplate(
		templateId: string,
		updates: Partial<{
			name: string;
			description: string;
			systemPrompt: string;
			initialQuestion: string;
			modelId: string;
			color: string;
			documentMode: boolean;
		}>
	): Promise<boolean> {
		return templateApi.updateTemplate(templateId, updates);
	},

	/**
	 * Delete a template
	 */
	async deleteTemplate(templateId: string): Promise<boolean> {
		return templateApi.deleteTemplate(templateId);
	},

	/**
	 * Set a template as default
	 */
	async setDefaultTemplate(templateId: string, userId: string): Promise<boolean> {
		return templateApi.setDefaultTemplate(templateId);
	},
};
