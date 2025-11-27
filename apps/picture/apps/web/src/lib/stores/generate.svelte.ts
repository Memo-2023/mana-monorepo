/**
 * Generate Store - Svelte 5 Runes Version
 */

// State using Svelte 5 runes
let isGenerating = $state(false);
let generationProgress = $state('');
let generationError = $state('');
let currentGenerationId = $state<string | null>(null);

export const generateStore = {
  get isGenerating() {
    return isGenerating;
  },
  get generationProgress() {
    return generationProgress;
  },
  get generationError() {
    return generationError;
  },
  get currentGenerationId() {
    return currentGenerationId;
  },

  startGeneration(generationId?: string) {
    isGenerating = true;
    generationProgress = 'Starting...';
    generationError = '';
    currentGenerationId = generationId || null;
  },

  updateProgress(progress: string) {
    generationProgress = progress;
  },

  setError(error: string) {
    generationError = error;
    isGenerating = false;
  },

  completeGeneration() {
    isGenerating = false;
    generationProgress = 'Complete!';
    currentGenerationId = null;
  },

  cancelGeneration() {
    isGenerating = false;
    generationProgress = '';
    generationError = '';
    currentGenerationId = null;
  },

  reset() {
    isGenerating = false;
    generationProgress = '';
    generationError = '';
    currentGenerationId = null;
  },
};

// Export individual getters for backwards compatibility
export function getIsGenerating() {
  return isGenerating;
}

export function getGenerationProgress() {
  return generationProgress;
}

export function getGenerationError() {
  return generationError;
}
