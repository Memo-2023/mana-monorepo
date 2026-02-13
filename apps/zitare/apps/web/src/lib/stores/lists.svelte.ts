// Lists store - integrates with Zitare backend API
import { browser } from '$app/environment';
import { authStore } from './auth.svelte';

const API_URL = browser
	? import.meta.env.PUBLIC_ZITARE_API_URL || 'http://localhost:3007'
	: 'http://localhost:3007';

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

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
	const token = await authStore.getValidToken();
	if (!token) {
		throw new Error('Not authenticated');
	}

	return fetch(url, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`,
			...options.headers,
		},
	});
}

async function loadLists() {
	if (!authStore.isAuthenticated) {
		lists = [];
		return;
	}

	isLoading = true;
	error = null;

	try {
		const response = await fetchWithAuth(`${API_URL}/lists`);
		if (!response.ok) {
			throw new Error('Failed to load lists');
		}
		const data = await response.json();
		lists = data.lists || [];
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to load lists';
		lists = [];
	} finally {
		isLoading = false;
	}
}

async function getList(id: string): Promise<QuoteList | null> {
	if (!authStore.isAuthenticated) {
		return null;
	}

	try {
		const response = await fetchWithAuth(`${API_URL}/lists/${id}`);
		if (!response.ok) {
			return null;
		}
		const data = await response.json();
		return data.list || null;
	} catch {
		return null;
	}
}

async function createList(name: string, description?: string): Promise<QuoteList | null> {
	if (!authStore.isAuthenticated) {
		return null;
	}

	try {
		const response = await fetchWithAuth(`${API_URL}/lists`, {
			method: 'POST',
			body: JSON.stringify({ name, description }),
		});
		if (!response.ok) {
			throw new Error('Failed to create list');
		}
		const data = await response.json();
		const newList = data.list;
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
	if (!authStore.isAuthenticated) {
		return null;
	}

	try {
		const response = await fetchWithAuth(`${API_URL}/lists/${id}`, {
			method: 'PUT',
			body: JSON.stringify(updates),
		});
		if (!response.ok) {
			throw new Error('Failed to update list');
		}
		const data = await response.json();
		const updatedList = data.list;
		lists = lists.map((l) => (l.id === id ? updatedList : l));
		return updatedList;
	} catch {
		return null;
	}
}

async function deleteList(id: string): Promise<boolean> {
	if (!authStore.isAuthenticated) {
		return false;
	}

	try {
		const response = await fetchWithAuth(`${API_URL}/lists/${id}`, {
			method: 'DELETE',
		});
		if (!response.ok) {
			throw new Error('Failed to delete list');
		}
		lists = lists.filter((l) => l.id !== id);
		return true;
	} catch {
		return false;
	}
}

async function addQuoteToList(listId: string, quoteId: string): Promise<boolean> {
	if (!authStore.isAuthenticated) {
		return false;
	}

	try {
		const response = await fetchWithAuth(`${API_URL}/lists/${listId}/quotes`, {
			method: 'POST',
			body: JSON.stringify({ quoteId }),
		});
		if (!response.ok) {
			throw new Error('Failed to add quote to list');
		}
		const data = await response.json();
		lists = lists.map((l) => (l.id === listId ? data.list : l));
		return true;
	} catch {
		return false;
	}
}

async function removeQuoteFromList(listId: string, quoteId: string): Promise<boolean> {
	if (!authStore.isAuthenticated) {
		return false;
	}

	try {
		const response = await fetchWithAuth(`${API_URL}/lists/${listId}/quotes/${quoteId}`, {
			method: 'DELETE',
		});
		if (!response.ok) {
			throw new Error('Failed to remove quote from list');
		}
		const data = await response.json();
		lists = lists.map((l) => (l.id === listId ? data.list : l));
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
