/**
 * Lists Store — Local-First with Dexie.js
 */

import { listCollection, type LocalQuoteList } from '$lib/data/local-store';

export interface QuoteList {
	id: string;
	name: string;
	description?: string;
	quoteIds: string[];
	createdAt: string;
	updatedAt: string;
}

let lists = $state<QuoteList[]>([]);
let isLoading = $state(false);
let error = $state<string | null>(null);

function toQuoteList(local: LocalQuoteList): QuoteList {
	return {
		id: local.id,
		name: local.name,
		description: local.description ?? undefined,
		quoteIds: local.quoteIds,
		createdAt: local.createdAt ?? new Date().toISOString(),
		updatedAt: local.updatedAt ?? new Date().toISOString(),
	};
}

async function loadLists() {
	isLoading = true;
	error = null;
	try {
		const localLists = await listCollection.getAll();
		lists = localLists.map(toQuoteList);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load lists';
		lists = [];
	} finally {
		isLoading = false;
	}
}

async function getList(id: string): Promise<QuoteList | null> {
	const local = await listCollection.get(id);
	return local ? toQuoteList(local) : null;
}

async function createList(name: string, description?: string): Promise<QuoteList | null> {
	try {
		const newLocal: LocalQuoteList = {
			id: crypto.randomUUID(),
			name,
			description: description ?? null,
			quoteIds: [],
		};
		const inserted = await listCollection.insert(newLocal);
		const newList = toQuoteList(inserted);
		lists = [...lists, newList];
		return newList;
	} catch {
		return null;
	}
}

async function updateList(
	id: string,
	updates: { name?: string; description?: string }
): Promise<QuoteList | null> {
	try {
		const updated = await listCollection.update(id, updates as Partial<LocalQuoteList>);
		if (updated) {
			const updatedList = toQuoteList(updated);
			lists = lists.map((l) => (l.id === id ? updatedList : l));
			return updatedList;
		}
		return null;
	} catch {
		return null;
	}
}

async function deleteList(id: string): Promise<boolean> {
	try {
		await listCollection.delete(id);
		lists = lists.filter((l) => l.id !== id);
		return true;
	} catch {
		return false;
	}
}

async function addQuoteToList(listId: string, quoteId: string): Promise<boolean> {
	try {
		const existing = await listCollection.get(listId);
		if (!existing) return false;

		const quoteIds = [...(existing.quoteIds || [])];
		if (!quoteIds.includes(quoteId)) {
			quoteIds.push(quoteId);
		}

		const updated = await listCollection.update(listId, { quoteIds } as Partial<LocalQuoteList>);
		if (updated) {
			lists = lists.map((l) => (l.id === listId ? toQuoteList(updated) : l));
		}
		return true;
	} catch {
		return false;
	}
}

async function removeQuoteFromList(listId: string, quoteId: string): Promise<boolean> {
	try {
		const existing = await listCollection.get(listId);
		if (!existing) return false;

		const quoteIds = (existing.quoteIds || []).filter((qid) => qid !== quoteId);

		const updated = await listCollection.update(listId, { quoteIds } as Partial<LocalQuoteList>);
		if (updated) {
			lists = lists.map((l) => (l.id === listId ? toQuoteList(updated) : l));
		}
		return true;
	} catch {
		return false;
	}
}

export const listsStore = {
	get lists() {
		return lists;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},
	loadLists,
	getList,
	createList,
	updateList,
	deleteList,
	addQuoteToList,
	removeQuoteFromList,
};
