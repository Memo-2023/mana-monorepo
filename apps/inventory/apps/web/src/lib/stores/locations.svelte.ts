import { locationsApi, type LocationWithChildren } from '$lib/api';
import { authStore } from './auth.svelte';
import type { Location, CreateLocationInput, UpdateLocationInput } from '@inventory/shared';

// State
let locations = $state<LocationWithChildren[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

// Flatten tree for select dropdowns
let flatLocations = $derived(flattenTree(locations));

function flattenTree(tree: LocationWithChildren[], level = 0): (Location & { level: number })[] {
	const result: (Location & { level: number })[] = [];
	for (const node of tree) {
		result.push({ ...node, level });
		if (node.children?.length) {
			result.push(...flattenTree(node.children, level + 1));
		}
	}
	return result;
}

async function fetchLocations() {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		locations = await locationsApi.getAll(token || undefined);
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to fetch locations';
	} finally {
		loading = false;
	}
}

async function createLocation(data: CreateLocationInput): Promise<Location | null> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		const location = await locationsApi.create(data, token || undefined);
		await fetchLocations();
		return location;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to create location';
		return null;
	} finally {
		loading = false;
	}
}

async function updateLocation(id: string, data: UpdateLocationInput): Promise<Location | null> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		const location = await locationsApi.update(id, data, token || undefined);
		await fetchLocations();
		return location;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to update location';
		return null;
	} finally {
		loading = false;
	}
}

async function deleteLocation(id: string): Promise<boolean> {
	loading = true;
	error = null;

	try {
		const token = await authStore.getAccessToken();
		await locationsApi.delete(id, token || undefined);
		await fetchLocations();
		return true;
	} catch (e) {
		error = e instanceof Error ? e.message : 'Failed to delete location';
		return false;
	} finally {
		loading = false;
	}
}

function clearError() {
	error = null;
}

export const locationsStore = {
	get locations() {
		return locations;
	},
	get flatLocations() {
		return flatLocations;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	fetchLocations,
	createLocation,
	updateLocation,
	deleteLocation,
	clearError,
};
