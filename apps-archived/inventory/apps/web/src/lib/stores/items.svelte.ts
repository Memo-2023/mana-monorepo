import { itemsApi } from '$lib/api';
import { authStore } from './auth.svelte';
import type {
	Item,
	ItemPhoto,
	ItemDocument,
	CreateItemInput,
	UpdateItemInput,
	ItemQueryParams,
	Pagination,
} from '@inventory/shared';

type ItemWithDetails = Item & { photos?: ItemPhoto[]; documents?: ItemDocument[] };

// State
let items = $state<Item[]>([]);
let selectedItem = $state<ItemWithDetails | null>(null);
let pagination = $state<Pagination | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

// Filters
let filters = $state<ItemQueryParams>({
	page: 1,
	limit: 20,
	sortBy: 'createdAt',
	sortOrder: 'desc',
	isArchived: false,
});

async function fetchItems(params?: Partial<ItemQueryParams>) {
	loading = true;
	error = null;

	if (params) {
		filters = { ...filters, ...params };
	}

	try {
		const token = await authStore.getAccessToken();
		const result = await itemsApi.getAll(filters, token || undefined);
		items = result.data;
		pagination = result.pagination;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to fetch items';
	} finally {
		loading = false;
	}
}

async function fetchItem(id: string) {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		selectedItem = await itemsApi.getOne(id, token || undefined);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to fetch item';
		selectedItem = null;
	} finally {
		loading = false;
	}
}

async function createItem(data: CreateItemInput): Promise<Item | null> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		const item = await itemsApi.create(data, token || undefined);
		await fetchItems();
		return item;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to create item';
		return null;
	} finally {
		loading = false;
	}
}

async function updateItem(id: string, data: UpdateItemInput): Promise<Item | null> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		const item = await itemsApi.update(id, data, token || undefined);
		if (selectedItem?.id === id) {
			selectedItem = { ...selectedItem, ...item };
		}
		await fetchItems();
		return item;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to update item';
		return null;
	} finally {
		loading = false;
	}
}

async function deleteItem(id: string): Promise<boolean> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		await itemsApi.delete(id, token || undefined);
		if (selectedItem?.id === id) {
			selectedItem = null;
		}
		await fetchItems();
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to delete item';
		return false;
	} finally {
		loading = false;
	}
}

async function toggleFavorite(id: string): Promise<boolean> {
	try {
		const token = await authStore.getAccessToken();
		const item = await itemsApi.toggleFavorite(id, token || undefined);
		items = items.map((i) => (i.id === id ? item : i));
		if (selectedItem?.id === id) {
			selectedItem = { ...selectedItem, ...item };
		}
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to toggle favorite';
		return false;
	}
}

async function toggleArchive(id: string): Promise<boolean> {
	try {
		const token = await authStore.getAccessToken();
		await itemsApi.toggleArchive(id, token || undefined);
		await fetchItems();
		if (selectedItem?.id === id) {
			selectedItem = null;
		}
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to toggle archive';
		return false;
	}
}

async function uploadPhotos(itemId: string, files: File[]): Promise<ItemPhoto[]> {
	try {
		const token = await authStore.getAccessToken();
		const photos = await itemsApi.uploadPhotos(itemId, files, token || undefined);
		if (selectedItem?.id === itemId) {
			selectedItem = {
				...selectedItem,
				photos: [...(selectedItem.photos || []), ...photos],
			};
		}
		return photos;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to upload photos';
		return [];
	}
}

async function deletePhoto(itemId: string, photoId: string): Promise<boolean> {
	try {
		const token = await authStore.getAccessToken();
		await itemsApi.deletePhoto(itemId, photoId, token || undefined);
		if (selectedItem?.id === itemId && selectedItem.photos) {
			selectedItem = {
				...selectedItem,
				photos: selectedItem.photos.filter((p) => p.id !== photoId),
			};
		}
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to delete photo';
		return false;
	}
}

function clearSelection() {
	selectedItem = null;
}

function clearError() {
	error = null;
}

export const itemsStore = {
	get items() {
		return items;
	},
	get selectedItem() {
		return selectedItem;
	},
	get pagination() {
		return pagination;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get filters() {
		return filters;
	},
	fetchItems,
	fetchItem,
	createItem,
	updateItem,
	deleteItem,
	toggleFavorite,
	toggleArchive,
	uploadPhotos,
	deletePhoto,
	clearSelection,
	clearError,
};
