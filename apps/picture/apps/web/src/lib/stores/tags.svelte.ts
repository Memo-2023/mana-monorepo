/**
 * Tags Store - Svelte 5 Runes Version
 */

import type { Tag } from '$lib/api/tags';

// State using Svelte 5 runes
let tags = $state<Tag[]>([]);
let selectedTags = $state<string[]>([]);
let isLoadingTags = $state(false);

export const tagsStore = {
  get tags() {
    return tags;
  },
  get selectedTags() {
    return selectedTags;
  },
  get isLoadingTags() {
    return isLoadingTags;
  },

  setTags(newTags: Tag[]) {
    tags = newTags;
  },

  addTag(tag: Tag) {
    tags = [...tags, tag];
  },

  updateTag(id: string, updates: Partial<Tag>) {
    tags = tags.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag));
  },

  removeTag(id: string) {
    tags = tags.filter((tag) => tag.id !== id);
    selectedTags = selectedTags.filter((tagId) => tagId !== id);
  },

  selectTag(tagId: string) {
    if (!selectedTags.includes(tagId)) {
      selectedTags = [...selectedTags, tagId];
    }
  },

  deselectTag(tagId: string) {
    selectedTags = selectedTags.filter((id) => id !== tagId);
  },

  toggleTag(tagId: string) {
    if (selectedTags.includes(tagId)) {
      selectedTags = selectedTags.filter((id) => id !== tagId);
    } else {
      selectedTags = [...selectedTags, tagId];
    }
  },

  setSelectedTags(tagIds: string[]) {
    selectedTags = tagIds;
  },

  clearSelectedTags() {
    selectedTags = [];
  },

  setLoading(loading: boolean) {
    isLoadingTags = loading;
  },

  reset() {
    tags = [];
    selectedTags = [];
    isLoadingTags = false;
  },
};

// Export individual getters for backwards compatibility
export function getTags() {
  return tags;
}

export function getSelectedTags() {
  return selectedTags;
}
