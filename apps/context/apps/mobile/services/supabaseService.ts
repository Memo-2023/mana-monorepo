/**
 * Data service for Context mobile app.
 * Now routes all operations through the Context NestJS backend API
 * instead of direct Supabase database access.
 */
import {
	spacesApi,
	documentsApi,
	type Space,
	type Document,
	type DocumentMetadata,
} from './backendApi';

// Re-export types for backward compatibility
export type { Space, Document, DocumentMetadata };

// Also export the User type for backward compatibility
export type User = {
	id: string;
	email: string;
	name: string | null;
	created_at: string;
};

// ============================================================================
// Space Services
// ============================================================================

export const getSpaces = async (): Promise<Space[]> => {
	return spacesApi.list();
};

export const getSpaceById = async (id: string): Promise<Space | null> => {
	return spacesApi.get(id);
};

export const createSpace = async (
	name: string,
	description?: string,
	settings?: any,
	pinned: boolean = true
): Promise<{ data: Space | null; error: any }> => {
	const result = await spacesApi.create({ name, description, settings, pinned });
	return { data: result.data, error: result.error };
};

export const updateSpace = async (
	id: string,
	updates: Partial<Space>
): Promise<{ success: boolean; error: any }> => {
	return spacesApi.update(id, updates);
};

export const toggleSpacePinned = async (
	id: string,
	pinned: boolean
): Promise<{ success: boolean; error: any }> => {
	return spacesApi.update(id, { pinned });
};

export const deleteSpace = async (id: string): Promise<{ success: boolean; error: any }> => {
	return spacesApi.delete(id);
};

// ============================================================================
// Document Services
// ============================================================================

export const getDocuments = async (spaceId?: string): Promise<Document[]> => {
	return documentsApi.list({ spaceId });
};

export const getDocumentsWithPreview = async (
	spaceId?: string,
	limit: number = 50
): Promise<Document[]> => {
	return documentsApi.list({ spaceId, preview: true, limit });
};

export const getRecentDocuments = async (limit: number = 5): Promise<Document[]> => {
	return documentsApi.listRecent(limit);
};

export const getDocumentById = async (id: string): Promise<Document | null> => {
	return documentsApi.get(id);
};

export const getDocumentByShortId = async (shortId: string): Promise<Document | null> => {
	// The backend should handle short_id lookup via the same GET endpoint
	// Try fetching by ID first - if the backend supports short_id resolution this will work
	return documentsApi.get(shortId);
};

export const createDocument = async (
	content: string,
	type: 'text' | 'context' | 'prompt',
	spaceId?: string,
	metadata?: any,
	title?: string
): Promise<{ data: Document | null; error: any }> => {
	const result = await documentsApi.create({
		content,
		type,
		spaceId,
		metadata,
		title,
	});
	return { data: result.data, error: result.error };
};

export const updateDocument = async (
	id: string,
	updates: Partial<Document>
): Promise<{ success: boolean; error: any }> => {
	return documentsApi.update(id, updates);
};

export const deleteDocument = async (id: string): Promise<{ success: boolean; error: any }> => {
	return documentsApi.delete(id);
};

export const toggleDocumentPinned = async (
	id: string,
	pinned: boolean
): Promise<{ success: boolean; error: any }> => {
	return documentsApi.togglePinned(id, pinned);
};

export const saveDocumentTags = async (
	id: string,
	tags: string[]
): Promise<{ success: boolean; error: any }> => {
	return documentsApi.updateTags(id, tags);
};

export const getDocumentVersions = async (
	documentId: string
): Promise<{ data: Document[]; error: any }> => {
	return documentsApi.getVersions(documentId);
};

export const getAdjacentDocumentVersion = async (
	documentId: string,
	direction: 'next' | 'previous'
): Promise<{ data: string | null; error: any }> => {
	try {
		const { data: versions, error } = await documentsApi.getVersions(documentId);

		if (error || !versions.length) {
			return { data: null, error: error || 'Keine Versionen gefunden' };
		}

		const currentIndex = versions.findIndex((doc) => doc.id === documentId);

		if (currentIndex === -1) {
			return { data: null, error: 'Aktuelles Dokument nicht in Versionen gefunden' };
		}

		let targetIndex;
		if (direction === 'next') {
			targetIndex = currentIndex + 1;
			if (targetIndex >= versions.length) {
				return { data: null, error: 'Keine neuere Version verfügbar' };
			}
		} else {
			targetIndex = currentIndex - 1;
			if (targetIndex < 0) {
				return { data: null, error: 'Keine ältere Version verfügbar' };
			}
		}

		return { data: versions[targetIndex].id, error: null };
	} catch (error) {
		console.error(
			`Fehler beim Abrufen der ${direction === 'next' ? 'nächsten' : 'vorherigen'} Version:`,
			error
		);
		return { data: null, error: `Fehler beim Abrufen der Version: ${error}` };
	}
};

export const createDocumentVersion = async (
	originalDocumentId: string,
	newContent: string,
	generationType: 'summary' | 'continuation' | 'rewrite' | 'ideas',
	aiModel: string,
	prompt: string
): Promise<{ data: Document | null; error: any }> => {
	return documentsApi.createVersion(originalDocumentId, {
		generationType,
		content: newContent,
		aiModel,
		prompt,
	});
};
