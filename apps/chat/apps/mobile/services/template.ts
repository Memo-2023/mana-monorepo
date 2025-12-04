/**
 * Template Service - CRUD operations via Backend API
 */
import { templateApi } from './api';
import type { Template as ApiTemplate } from './api';

// Re-export type with backwards-compatible naming (snake_case for mobile)
export interface Template {
	id: string;
	user_id: string;
	name: string;
	description: string | null;
	system_prompt: string;
	initial_question: string | null;
	model_id: string | null;
	color: string;
	is_default: boolean;
	document_mode: boolean;
	created_at: string;
	updated_at: string;
}

// Helper to convert API response to local format
function toLocalTemplate(template: ApiTemplate): Template {
	return {
		id: template.id,
		user_id: template.userId,
		name: template.name,
		description: template.description || null,
		system_prompt: template.systemPrompt,
		initial_question: template.initialQuestion || null,
		model_id: template.modelId || null,
		color: template.color,
		is_default: template.isDefault,
		document_mode: template.documentMode,
		created_at: template.createdAt,
		updated_at: template.updatedAt,
	};
}

/**
 * Lädt alle Vorlagen eines Benutzers
 */
export async function getTemplates(userId: string): Promise<Template[]> {
	try {
		const templates = await templateApi.getTemplates();
		return templates.map(toLocalTemplate);
	} catch (error) {
		console.error('Fehler beim Laden der Vorlagen:', error);
		return [];
	}
}

/**
 * Lädt eine bestimmte Vorlage anhand ihrer ID
 */
export async function getTemplateById(templateId: string): Promise<Template | null> {
	try {
		const template = await templateApi.getTemplate(templateId);
		if (!template) {
			return null;
		}
		return toLocalTemplate(template);
	} catch (error) {
		console.error('Fehler beim Laden der Vorlage:', error);
		return null;
	}
}

/**
 * Erstellt eine neue Vorlage
 */
export async function createTemplate(
	template: Omit<Template, 'id' | 'created_at' | 'updated_at'>
): Promise<Template | null> {
	try {
		const result = await templateApi.createTemplate({
			name: template.name,
			description: template.description || undefined,
			systemPrompt: template.system_prompt,
			initialQuestion: template.initial_question || undefined,
			modelId: template.model_id || undefined,
			color: template.color,
			documentMode: template.document_mode,
		});

		if (!result) {
			console.error('Fehler beim Erstellen der Vorlage');
			return null;
		}

		return toLocalTemplate(result);
	} catch (error) {
		console.error('Fehler beim Erstellen der Vorlage:', error);
		return null;
	}
}

/**
 * Aktualisiert eine bestehende Vorlage
 */
export async function updateTemplate(
	templateId: string,
	updates: Partial<Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
	try {
		const apiUpdates: Parameters<typeof templateApi.updateTemplate>[1] = {};

		if (updates.name !== undefined) apiUpdates.name = updates.name;
		if (updates.description !== undefined)
			apiUpdates.description = updates.description || undefined;
		if (updates.system_prompt !== undefined) apiUpdates.systemPrompt = updates.system_prompt;
		if (updates.initial_question !== undefined)
			apiUpdates.initialQuestion = updates.initial_question || undefined;
		if (updates.model_id !== undefined) apiUpdates.modelId = updates.model_id || undefined;
		if (updates.color !== undefined) apiUpdates.color = updates.color;
		if (updates.document_mode !== undefined) apiUpdates.documentMode = updates.document_mode;

		return await templateApi.updateTemplate(templateId, apiUpdates);
	} catch (error) {
		console.error('Fehler beim Aktualisieren der Vorlage:', error);
		return false;
	}
}

/**
 * Löscht eine Vorlage
 */
export async function deleteTemplate(templateId: string): Promise<boolean> {
	try {
		return await templateApi.deleteTemplate(templateId);
	} catch (error) {
		console.error('Fehler beim Löschen der Vorlage:', error);
		return false;
	}
}

/**
 * Setzt eine Vorlage als Standard
 */
export async function setDefaultTemplate(templateId: string, userId: string): Promise<boolean> {
	try {
		return await templateApi.setDefaultTemplate(templateId);
	} catch (error) {
		console.error('Fehler beim Setzen der Standard-Vorlage:', error);
		return false;
	}
}

/**
 * Holt die Standard-Vorlage des Benutzers
 */
export async function getDefaultTemplate(userId: string): Promise<Template | null> {
	try {
		const template = await templateApi.getDefaultTemplate();
		if (!template) {
			return null;
		}
		return toLocalTemplate(template);
	} catch (error) {
		console.error('Fehler beim Laden der Standard-Vorlage:', error);
		return null;
	}
}
