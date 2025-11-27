import { create } from 'zustand';
import {
	getTags as apiGetTags,
	createTag as apiCreateTag,
	updateTag as apiUpdateTag,
	deleteTag as apiDeleteTag,
	getImageTags as apiGetImageTags,
	addTagToImage as apiAddTagToImage,
	removeTagFromImage as apiRemoveTagFromImage,
	type Tag,
} from '~/services/api/tags';

export type { Tag };

export interface ImageTag {
	id: string;
	imageId: string;
	tagId: string;
	addedAt: string;
	tag?: Tag;
}

interface TagStore {
	// State
	tags: Tag[];
	imageTags: Map<string, Tag[]>; // imageId -> tags
	selectedTags: string[]; // for filtering
	isLoading: boolean;
	error: string | null;

	// Actions - Tags
	fetchTags: () => Promise<void>;
	createTag: (name: string, color?: string) => Promise<Tag | null>;
	updateTag: (id: string, updates: Partial<Tag>) => Promise<boolean>;
	deleteTag: (id: string) => Promise<boolean>;

	// Actions - Image Tags
	fetchImageTags: (imageId: string) => Promise<void>;
	addTagsToImage: (imageId: string, tagIds: string[]) => Promise<boolean>;
	removeTagFromImage: (imageId: string, tagId: string) => Promise<boolean>;

	// Actions - Filtering
	toggleTagFilter: (tagId: string) => void;
	clearTagFilters: () => void;

	// Helpers
	getTagByName: (name: string) => Tag | undefined;
	getImageTags: (imageId: string) => Tag[];
}

export const useTagStore = create<TagStore>((set, get) => ({
	// Initial state
	tags: [],
	imageTags: new Map(),
	selectedTags: [],
	isLoading: false,
	error: null,

	// Fetch all tags
	fetchTags: async () => {
		set({ isLoading: true, error: null });
		try {
			const tags = await apiGetTags();
			set({ tags, isLoading: false });
		} catch (error: any) {
			set({ error: error.message, isLoading: false });
		}
	},

	// Create new tag
	createTag: async (name: string, color?: string) => {
		try {
			// Check if tag already exists
			const existing = get().getTagByName(name);
			if (existing) return existing;

			// Generate random color if not provided
			const tagColor =
				color ||
				`#${Math.floor(Math.random() * 16777215)
					.toString(16)
					.padStart(6, '0')}`;

			const newTag = await apiCreateTag({
				name: name.toLowerCase().trim(),
				color: tagColor,
			});

			set((state) => ({ tags: [...state.tags, newTag] }));
			return newTag;
		} catch (error: any) {
			// If already exists error, re-fetch tags
			if (error.message?.includes('already exists')) {
				await get().fetchTags();
				return get().getTagByName(name) || null;
			}
			set({ error: error.message });
			return null;
		}
	},

	// Update tag
	updateTag: async (id: string, updates: Partial<Tag>) => {
		try {
			// Only pass name and color to API (convert null to undefined)
			const updateData = {
				name: updates.name,
				color: updates.color ?? undefined,
			};
			const updatedTag = await apiUpdateTag(id, updateData);

			set((state) => ({
				tags: state.tags.map((tag) => (tag.id === id ? updatedTag : tag)),
			}));
			return true;
		} catch (error: any) {
			set({ error: error.message });
			return false;
		}
	},

	// Delete tag
	deleteTag: async (id: string) => {
		try {
			await apiDeleteTag(id);

			set((state) => ({
				tags: state.tags.filter((tag) => tag.id !== id),
				selectedTags: state.selectedTags.filter((tagId) => tagId !== id),
				imageTags: new Map(
					Array.from(state.imageTags.entries()).map(([imageId, tags]) => [
						imageId,
						tags.filter((tag) => tag.id !== id),
					])
				),
			}));
			return true;
		} catch (error: any) {
			set({ error: error.message });
			return false;
		}
	},

	// Fetch tags for specific image
	fetchImageTags: async (imageId: string) => {
		try {
			const tags = await apiGetImageTags(imageId);

			set((state) => {
				const newImageTags = new Map(state.imageTags);
				newImageTags.set(imageId, tags);
				return { imageTags: newImageTags };
			});
		} catch (error: any) {
			set({ error: error.message });
		}
	},

	// Add tags to image
	addTagsToImage: async (imageId: string, tagIds: string[]) => {
		try {
			// Add tags sequentially (API doesn't support batch)
			await Promise.all(tagIds.map((tagId) => apiAddTagToImage(imageId, tagId)));

			// Update local state
			const allTags = get().tags;
			const newTags = tagIds.map((id) => allTags.find((t) => t.id === id)).filter(Boolean) as Tag[];

			set((state) => {
				const newImageTags = new Map(state.imageTags);
				const currentTags = newImageTags.get(imageId) || [];
				const uniqueTags = [...currentTags, ...newTags].filter(
					(tag, index, self) => index === self.findIndex((t) => t.id === tag.id)
				);
				newImageTags.set(imageId, uniqueTags);
				return { imageTags: newImageTags };
			});

			return true;
		} catch (error: any) {
			set({ error: error.message });
			return false;
		}
	},

	// Remove tag from image
	removeTagFromImage: async (imageId: string, tagId: string) => {
		try {
			await apiRemoveTagFromImage(imageId, tagId);

			set((state) => {
				const newImageTags = new Map(state.imageTags);
				const currentTags = newImageTags.get(imageId) || [];
				newImageTags.set(
					imageId,
					currentTags.filter((tag) => tag.id !== tagId)
				);
				return { imageTags: newImageTags };
			});

			return true;
		} catch (error: any) {
			set({ error: error.message });
			return false;
		}
	},

	// Toggle tag filter
	toggleTagFilter: (tagId: string) => {
		set((state) => ({
			selectedTags: state.selectedTags.includes(tagId)
				? state.selectedTags.filter((id) => id !== tagId)
				: [...state.selectedTags, tagId],
		}));
	},

	// Clear all filters
	clearTagFilters: () => {
		set({ selectedTags: [] });
	},

	// Get tag by name
	getTagByName: (name: string) => {
		return get().tags.find((tag) => tag.name.toLowerCase() === name.toLowerCase().trim());
	},

	// Get tags for image
	getImageTags: (imageId: string) => {
		return get().imageTags.get(imageId) || [];
	},
}));
