import type { Space } from '$lib/types';
import * as spacesService from '$lib/services/spaces';

let spaces = $state<Space[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

export const spacesStore = {
	get spaces() {
		return spaces;
	},
	get loading() {
		return loading;
	},
	get error() {
		return error;
	},
	get pinnedSpaces() {
		return spaces.filter((s) => s.pinned);
	},

	async load() {
		loading = true;
		error = null;
		try {
			spaces = await spacesService.getSpaces();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Fehler beim Laden der Spaces';
		} finally {
			loading = false;
		}
	},

	async getById(id: string): Promise<Space | null> {
		return spacesService.getSpaceById(id);
	},

	async create(userId: string, name: string, description?: string) {
		const result = await spacesService.createSpace(userId, name, description);
		if (result.data) {
			spaces = [result.data, ...spaces];
		}
		return result;
	},

	async update(id: string, updates: Partial<Space>) {
		const result = await spacesService.updateSpace(id, updates);
		if (result.success) {
			spaces = spaces.map((s) => (s.id === id ? { ...s, ...updates } : s));
		}
		return result;
	},

	async togglePinned(id: string) {
		const space = spaces.find((s) => s.id === id);
		if (!space) return;
		const newPinned = !space.pinned;
		const result = await spacesService.toggleSpacePinned(id, newPinned);
		if (result.success) {
			spaces = spaces.map((s) => (s.id === id ? { ...s, pinned: newPinned } : s));
		}
		return result;
	},

	async delete(id: string) {
		const result = await spacesService.deleteSpace(id);
		if (result.success) {
			spaces = spaces.filter((s) => s.id !== id);
		}
		return result;
	},
};
