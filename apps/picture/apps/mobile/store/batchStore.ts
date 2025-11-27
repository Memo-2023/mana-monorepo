import { create } from 'zustand';
import {
  createBatch as apiCreateBatch,
  getBatch as apiGetBatch,
  getUserBatches as apiGetUserBatches,
  getBatchProgress as apiGetBatchProgress,
  retryFailed as apiRetryFailed,
  cancelBatch as apiCancelBatch,
  deleteBatch as apiDeleteBatch,
  type BatchGeneration,
  type BatchItem,
  type BatchPromptDto,
  type SharedSettingsDto,
} from '~/services/api/batch';

// Re-export types for consumers
export type { BatchGeneration, BatchItem };

// Legacy interfaces for backward compatibility (snake_case)
export interface BatchPrompt {
  text: string;
  negative_prompt?: string;
  seed?: number;
  tags?: string[];
}

export interface SharedSettings {
  model_id: string;
  model_version: string;
  width: number;
  height: number;
  steps: number;
  guidance_scale: number;
}

interface PollingState {
  intervalId: ReturnType<typeof setInterval> | null;
  batchId: string;
}

interface BatchStore {
  // State
  activeBatches: Map<string, BatchGeneration>;
  currentBatch: BatchGeneration | null;
  pollingStates: Map<string, PollingState>;

  // UI State
  isBatchModalOpen: boolean;
  isCreatingBatch: boolean;

  // Actions
  createBatch: (prompts: BatchPrompt[], settings: SharedSettings, name?: string) => Promise<string>;
  loadBatch: (batchId: string) => Promise<void>;
  loadUserBatches: () => Promise<void>;

  // Polling (replaces Realtime subscriptions)
  startPolling: (batchId: string, intervalMs?: number) => void;
  stopPolling: (batchId: string) => void;
  stopAllPolling: () => void;

  // Batch Actions
  retryFailed: (batchId: string) => Promise<void>;
  cancelBatch: (batchId: string) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<void>;

  // UI Actions
  openBatchModal: () => void;
  closeBatchModal: () => void;
  setCurrentBatch: (batch: BatchGeneration | null) => void;

  // Cleanup
  reset: () => void;
}

// Default polling interval (2 seconds)
const DEFAULT_POLL_INTERVAL = 2000;

export const useBatchStore = create<BatchStore>((set, get) => ({
  // Initial State
  activeBatches: new Map(),
  currentBatch: null,
  pollingStates: new Map(),
  isBatchModalOpen: false,
  isCreatingBatch: false,

  // Create a new batch
  createBatch: async (prompts, settings, name) => {
    set({ isCreatingBatch: true });

    try {
      // Convert snake_case inputs to camelCase for API
      const apiPrompts: BatchPromptDto[] = prompts.map(p => ({
        text: p.text,
        negativePrompt: p.negative_prompt,
        seed: p.seed,
        tags: p.tags,
      }));

      const apiSettings: SharedSettingsDto = {
        modelId: settings.model_id,
        modelVersion: settings.model_version,
        width: settings.width,
        height: settings.height,
        steps: settings.steps,
        guidanceScale: settings.guidance_scale,
      };

      const batch = await apiCreateBatch({
        prompts: apiPrompts,
        sharedSettings: apiSettings,
        batchName: name,
      });

      // Add to active batches
      set(state => {
        const newBatches = new Map(state.activeBatches);
        newBatches.set(batch.id, batch);
        return {
          activeBatches: newBatches,
          currentBatch: batch,
          isCreatingBatch: false
        };
      });

      // Start polling for updates
      get().startPolling(batch.id);

      return batch.id;
    } catch (error) {
      console.error('Error creating batch:', error);
      set({ isCreatingBatch: false });
      throw error;
    }
  },

  // Load a specific batch
  loadBatch: async (batchId) => {
    try {
      const batch = await apiGetBatch(batchId);

      set(state => {
        const newBatches = new Map(state.activeBatches);
        newBatches.set(batchId, batch);
        return {
          activeBatches: newBatches,
          currentBatch: batch
        };
      });

    } catch (error) {
      console.error('Error loading batch:', error);
      throw error;
    }
  },

  // Load all user batches
  loadUserBatches: async () => {
    try {
      const batches = await apiGetUserBatches();

      set(state => {
        const newBatches = new Map(state.activeBatches);
        batches.forEach(batch => {
          newBatches.set(batch.id, batch);
        });
        return { activeBatches: newBatches };
      });

    } catch (error) {
      console.error('Error loading batches:', error);
    }
  },

  // Start polling for batch updates
  startPolling: (batchId, intervalMs = DEFAULT_POLL_INTERVAL) => {
    const state = get();

    // Don't start if already polling this batch
    if (state.pollingStates.has(batchId)) return;

    const pollBatch = async () => {
      try {
        const progress = await apiGetBatchProgress(batchId);

        set(state => {
          const newBatches = new Map(state.activeBatches);
          const existing = newBatches.get(batchId);
          if (existing) {
            newBatches.set(batchId, {
              ...existing,
              totalCount: progress.totalCount,
              completedCount: progress.completedCount,
              failedCount: progress.failedCount,
              processingCount: progress.processingCount,
              pendingCount: progress.pendingCount,
              status: progress.status as BatchGeneration['status'],
            });

            // Update currentBatch if it's this batch
            const updatedBatch = newBatches.get(batchId);
            if (state.currentBatch?.id === batchId && updatedBatch) {
              return {
                activeBatches: newBatches,
                currentBatch: updatedBatch
              };
            }
          }
          return { activeBatches: newBatches };
        });

        // Stop polling if batch is complete or failed
        if (progress.status === 'completed' || progress.status === 'failed' || progress.status === 'partial') {
          // Load full batch details one more time
          await get().loadBatch(batchId);
          get().stopPolling(batchId);
        }
      } catch (error) {
        console.error('Error polling batch:', error);
        // Stop polling on error to prevent spamming
        get().stopPolling(batchId);
      }
    };

    // Poll immediately, then at interval
    pollBatch();
    const intervalId = setInterval(pollBatch, intervalMs);

    set(state => {
      const newPolling = new Map(state.pollingStates);
      newPolling.set(batchId, { intervalId, batchId });
      return { pollingStates: newPolling };
    });
  },

  // Stop polling for a specific batch
  stopPolling: (batchId) => {
    const state = get();
    const pollingState = state.pollingStates.get(batchId);

    if (pollingState?.intervalId) {
      clearInterval(pollingState.intervalId);
      set(state => {
        const newPolling = new Map(state.pollingStates);
        newPolling.delete(batchId);
        return { pollingStates: newPolling };
      });
    }
  },

  // Stop all polling
  stopAllPolling: () => {
    const state = get();
    state.pollingStates.forEach(pollingState => {
      if (pollingState.intervalId) {
        clearInterval(pollingState.intervalId);
      }
    });
    set({ pollingStates: new Map() });
  },

  // Retry failed generations in a batch
  retryFailed: async (batchId) => {
    try {
      await apiRetryFailed(batchId);

      // Reload batch and restart polling
      await get().loadBatch(batchId);
      get().startPolling(batchId);

    } catch (error) {
      console.error('Error retrying batch:', error);
      throw error;
    }
  },

  // Cancel a batch
  cancelBatch: async (batchId) => {
    try {
      await apiCancelBatch(batchId);

      // Stop polling and reload batch
      get().stopPolling(batchId);
      await get().loadBatch(batchId);

    } catch (error) {
      console.error('Error cancelling batch:', error);
      throw error;
    }
  },

  // Delete a batch and all its generations
  deleteBatch: async (batchId) => {
    try {
      await apiDeleteBatch(batchId);

      // Stop polling and remove from state
      get().stopPolling(batchId);

      set(state => {
        const newBatches = new Map(state.activeBatches);
        newBatches.delete(batchId);
        return {
          activeBatches: newBatches,
          currentBatch: state.currentBatch?.id === batchId ? null : state.currentBatch
        };
      });

    } catch (error) {
      console.error('Error deleting batch:', error);
      throw error;
    }
  },

  // UI Actions
  openBatchModal: () => set({ isBatchModalOpen: true }),
  closeBatchModal: () => set({ isBatchModalOpen: false }),
  setCurrentBatch: (batch) => set({ currentBatch: batch }),

  // Reset store
  reset: () => {
    get().stopAllPolling();
    set({
      activeBatches: new Map(),
      currentBatch: null,
      pollingStates: new Map(),
      isBatchModalOpen: false,
      isCreatingBatch: false
    });
  }
}));
