/**
 * Models Store - Svelte 5 Runes Version
 */

import type { Model } from '$lib/api/models';

// State using Svelte 5 runes
let models = $state<Model[]>([]);
let selectedModel = $state<Model | null>(null);
let isLoadingModels = $state(false);

export const modelsStore = {
  get models() {
    return models;
  },
  get selectedModel() {
    return selectedModel;
  },
  get isLoadingModels() {
    return isLoadingModels;
  },

  setModels(newModels: Model[]) {
    models = newModels;
    // Auto-select default model if no model selected
    if (!selectedModel && newModels.length > 0) {
      const defaultModel = newModels.find((m) => m.isDefault) || newModels[0];
      selectedModel = defaultModel;
    }
  },

  selectModel(model: Model | null) {
    selectedModel = model;
  },

  selectModelById(id: string) {
    const model = models.find((m) => m.id === id);
    if (model) {
      selectedModel = model;
    }
  },

  setLoading(loading: boolean) {
    isLoadingModels = loading;
  },

  reset() {
    models = [];
    selectedModel = null;
    isLoadingModels = false;
  },
};

// Export individual getters for backwards compatibility
export function getModels() {
  return models;
}

export function getSelectedModel() {
  return selectedModel;
}
