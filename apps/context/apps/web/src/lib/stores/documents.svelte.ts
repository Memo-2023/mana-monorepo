import type { Document, DocumentType } from '$lib/types';
import { ContextEvents } from '@manacore/shared-utils/analytics';
import * as docsService from '$lib/services/documents';

let documents = $state<Document[]>([]);
let currentDocument = $state<Document | null>(null);
let loading = $state(false);
let saving = $state(false);
let error = $state<string | null>(null);

// Filter state
let searchQuery = $state('');
let typeFilter = $state<DocumentType | 'all'>('all');
let tagFilter = $state<string[]>([]);

export const documentsStore = {
	get documents() {
		return documents;
	},
	get currentDocument() {
		return currentDocument;
	},
	get loading() {
		return loading;
	},
	get saving() {
		return saving;
	},
	get error() {
		return error;
	},
	get searchQuery() {
		return searchQuery;
	},
	get typeFilter() {
		return typeFilter;
	},
	get tagFilter() {
		return tagFilter;
	},

	get filteredDocuments() {
		let filtered = documents;

		if (typeFilter !== 'all') {
			filtered = filtered.filter((d) => d.type === typeFilter);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(d) => d.title.toLowerCase().includes(q) || d.content?.toLowerCase().includes(q)
			);
		}

		if (tagFilter.length > 0) {
			filtered = filtered.filter((d) => tagFilter.some((tag) => d.metadata?.tags?.includes(tag)));
		}

		return filtered;
	},

	get allTags() {
		const tags = new Set<string>();
		documents.forEach((d) => {
			d.metadata?.tags?.forEach((t) => tags.add(t));
		});
		return Array.from(tags).sort();
	},

	get stats() {
		return {
			total: documents.length,
			text: documents.filter((d) => d.type === 'text').length,
			context: documents.filter((d) => d.type === 'context').length,
			prompt: documents.filter((d) => d.type === 'prompt').length,
			totalWords: documents.reduce((sum, d) => sum + (d.metadata?.word_count || 0), 0),
		};
	},

	setSearchQuery(query: string) {
		searchQuery = query;
	},

	setTypeFilter(filter: DocumentType | 'all') {
		typeFilter = filter;
	},

	setTagFilter(tags: string[]) {
		tagFilter = tags;
	},

	async load(spaceId?: string) {
		loading = true;
		error = null;
		try {
			documents = await docsService.getDocumentsWithPreview(spaceId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Dokumente';
		} finally {
			loading = false;
		}
	},

	async loadDocument(id: string) {
		loading = true;
		error = null;
		try {
			currentDocument = await docsService.getDocumentById(id);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden des Dokuments';
		} finally {
			loading = false;
		}
	},

	async create(
		userId: string,
		content: string,
		type: DocumentType,
		spaceId?: string,
		title?: string
	) {
		saving = true;
		try {
			const result = await docsService.createDocument(
				userId,
				content,
				type,
				spaceId,
				undefined,
				title
			);
			if (result.data) {
				documents = [result.data, ...documents];
				currentDocument = result.data;
				ContextEvents.documentCreated(type);
			}
			return result;
		} finally {
			saving = false;
		}
	},

	async update(id: string, updates: Partial<Document>) {
		saving = true;
		try {
			const result = await docsService.updateDocument(id, updates);
			if (result.success) {
				documents = documents.map((d) => (d.id === id ? { ...d, ...updates } : d));
				if (currentDocument?.id === id) {
					currentDocument = { ...currentDocument, ...updates };
				}
			}
			return result;
		} finally {
			saving = false;
		}
	},

	async delete(id: string) {
		const result = await docsService.deleteDocument(id);
		if (result.success) {
			ContextEvents.documentDeleted();
			documents = documents.filter((d) => d.id !== id);
			if (currentDocument?.id === id) {
				currentDocument = null;
			}
		}
		return result;
	},

	async togglePinned(id: string) {
		const doc = documents.find((d) => d.id === id);
		if (!doc) return;
		const newPinned = !doc.pinned;
		const result = await docsService.toggleDocumentPinned(id, newPinned);
		if (result.success) {
			ContextEvents.documentPinned(newPinned);
			documents = documents.map((d) => (d.id === id ? { ...d, pinned: newPinned } : d));
			if (currentDocument?.id === id) {
				currentDocument = { ...currentDocument, pinned: newPinned };
			}
		}
		return result;
	},

	async saveTags(id: string, tags: string[]) {
		const result = await docsService.saveDocumentTags(id, tags);
		if (result.success) {
			documents = documents.map((d) =>
				d.id === id ? { ...d, metadata: { ...d.metadata, tags } } : d
			);
			if (currentDocument?.id === id) {
				currentDocument = {
					...currentDocument,
					metadata: { ...currentDocument.metadata, tags },
				};
			}
		}
		return result;
	},

	clearCurrent() {
		currentDocument = null;
	},
};
