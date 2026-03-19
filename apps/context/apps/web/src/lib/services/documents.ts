import { api } from '$lib/api/client';
import type { Document, DocumentMetadata, DocumentType } from '$lib/types';

export async function getDocuments(spaceId?: string): Promise<Document[]> {
	const params = new URLSearchParams();
	if (spaceId) params.set('spaceId', spaceId);

	const { data, error } = await api.get<{ documents: Document[] }>(`/documents?${params}`);
	if (error || !data) return [];
	return data.documents;
}

export async function getDocumentsWithPreview(
	spaceId?: string,
	limit: number = 50
): Promise<Document[]> {
	const params = new URLSearchParams({ preview: 'true', limit: String(limit) });
	if (spaceId) params.set('spaceId', spaceId);

	const { data, error } = await api.get<{ documents: Document[] }>(`/documents?${params}`);
	if (error || !data) return [];
	return data.documents;
}

export async function getRecentDocuments(userId: string, limit: number = 5): Promise<Document[]> {
	const params = new URLSearchParams({ limit: String(limit) });
	const { data, error } = await api.get<{ documents: Document[] }>(`/documents/recent?${params}`);
	if (error || !data) return [];
	return data.documents;
}

export async function getDocumentById(id: string): Promise<Document | null> {
	const { data, error } = await api.get<{ document: Document }>(`/documents/${id}`);
	if (error || !data) return null;
	return data.document;
}

export async function createDocument(
	userId: string,
	content: string,
	type: DocumentType,
	spaceId?: string,
	metadata?: Partial<DocumentMetadata>,
	title?: string
): Promise<{ data: Document | null; error: string | null }> {
	const { data, error } = await api.post<{ document: Document }>('/documents', {
		content,
		type,
		spaceId: spaceId || undefined,
		title,
		metadata,
	});

	if (error || !data) {
		return { data: null, error: error?.message || 'Fehler beim Erstellen' };
	}
	return { data: data.document, error: null };
}

export async function updateDocument(
	id: string,
	updates: Partial<Document>
): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.put(`/documents/${id}`, updates);
	return { success: !error, error: error?.message || null };
}

export async function deleteDocument(
	id: string
): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.delete(`/documents/${id}`);
	return { success: !error, error: error?.message || null };
}

export async function toggleDocumentPinned(
	id: string,
	pinned: boolean
): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.put(`/documents/${id}/pinned`, { pinned });
	return { success: !error, error: error?.message || null };
}

export async function saveDocumentTags(
	id: string,
	tags: string[]
): Promise<{ success: boolean; error: string | null }> {
	const { error } = await api.put(`/documents/${id}/tags`, { tags });
	return { success: !error, error: error?.message || null };
}

export async function getDocumentVersions(
	documentId: string
): Promise<{ data: Document[]; error: string | null }> {
	const { data, error } = await api.get<{ documents: Document[] }>(
		`/documents/${documentId}/versions`
	);
	if (error || !data) {
		return { data: [], error: error?.message || 'Fehler beim Laden der Versionen' };
	}
	return { data: data.documents, error: null };
}

export async function createDocumentVersion(
	originalDocumentId: string,
	userId: string,
	newContent: string,
	generationType: 'summary' | 'continuation' | 'rewrite' | 'ideas',
	aiModel: string,
	prompt: string
): Promise<{ data: Document | null; error: string | null }> {
	const { data, error } = await api.post<{ document: Document }>(
		`/documents/${originalDocumentId}/versions`,
		{
			content: newContent,
			generationType,
			model: aiModel,
			prompt,
		}
	);

	if (error || !data) {
		return { data: null, error: error?.message || 'Fehler beim Erstellen der Version' };
	}
	return { data: data.document, error: null };
}
