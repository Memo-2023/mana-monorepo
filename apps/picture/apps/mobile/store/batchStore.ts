import { create } from 'zustand';
import { supabase } from '~/utils/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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

export interface BatchGeneration {
  id: string;
  name: string;
  total_count: number;
  completed_count: number;
  failed_count: number;
  processing_count?: number;
  pending_count?: number;
  status: 'pending' | 'processing' | 'completed' | 'partial' | 'failed';
  created_at: string;
  completed_at?: string;
  items?: BatchItem[];
}

export interface BatchItem {
  id: string;
  index: number;
  prompt: string;
  status: string;
  error_message?: string;
  retry_count?: number;
  image_url?: string;
}

interface BatchStore {
  // State
  activeBatches: Map<string, BatchGeneration>;
  currentBatch: BatchGeneration | null;
  subscriptions: Map<string, RealtimeChannel>;
  
  // UI State
  isBatchModalOpen: boolean;
  isCreatingBatch: boolean;
  
  // Actions
  createBatch: (prompts: BatchPrompt[], settings: SharedSettings, name?: string) => Promise<string>;
  loadBatch: (batchId: string) => Promise<void>;
  loadUserBatches: () => Promise<void>;
  
  // Subscriptions
  subscribeToBatch: (batchId: string) => void;
  unsubscribeFromBatch: (batchId: string) => void;
  unsubscribeAll: () => void;
  
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

export const useBatchStore = create<BatchStore>((set, get) => ({
  // Initial State
  activeBatches: new Map(),
  currentBatch: null,
  subscriptions: new Map(),
  isBatchModalOpen: false,
  isCreatingBatch: false,

  // Create a new batch
  createBatch: async (prompts, settings, name) => {
    set({ isCreatingBatch: true });

    try {
      // Get the session to ensure we have a valid token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Call the batch-generate edge function with explicit auth header
      const response = await supabase.functions.invoke('batch-generate', {
        body: {
          prompts: prompts.map(p => ({
            text: p.text,
            negative_prompt: p.negative_prompt,
            seed: p.seed,
            tags: p.tags
          })),
          shared_settings: settings,
          batch_name: name
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        }
      });

      if (response.error) throw response.error;
      
      const { batch } = response.data;
      
      // Add to active batches
      const newBatch: BatchGeneration = {
        id: batch.id,
        name: batch.name,
        total_count: batch.total_count,
        completed_count: 0,
        failed_count: 0,
        status: 'processing',
        created_at: new Date().toISOString(),
        items: batch.generations
      };
      
      set(state => {
        const newBatches = new Map(state.activeBatches);
        newBatches.set(batch.id, newBatch);
        return { 
          activeBatches: newBatches,
          currentBatch: newBatch,
          isCreatingBatch: false
        };
      });
      
      // Subscribe to updates
      get().subscribeToBatch(batch.id);
      
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
      const { data: batch, error } = await supabase
        .from('batch_progress')
        .select('*')
        .eq('id', batchId)
        .single();

      if (error) throw error;
      
      const batchData: BatchGeneration = {
        id: batch.id,
        name: batch.name,
        total_count: batch.total_count,
        completed_count: batch.completed_count,
        failed_count: batch.failed_count,
        processing_count: batch.processing_count,
        pending_count: batch.pending_count,
        status: batch.status,
        created_at: batch.created_at,
        items: batch.items
      };
      
      set(state => {
        const newBatches = new Map(state.activeBatches);
        newBatches.set(batchId, batchData);
        return { 
          activeBatches: newBatches,
          currentBatch: batchData
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: batches, error } = await supabase
        .from('batch_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      set(state => {
        const newBatches = new Map(state.activeBatches);
        batches?.forEach(batch => {
          newBatches.set(batch.id, {
            id: batch.id,
            name: batch.name,
            total_count: batch.total_count,
            completed_count: batch.completed_count,
            failed_count: batch.failed_count,
            status: batch.status,
            created_at: batch.created_at,
            completed_at: batch.completed_at
          });
        });
        return { activeBatches: newBatches };
      });
      
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  },

  // Subscribe to batch updates
  subscribeToBatch: (batchId) => {
    const state = get();
    
    // Don't subscribe if already subscribed
    if (state.subscriptions.has(batchId)) return;
    
    const channel = supabase
      .channel(`batch_${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'batch_generations',
          filter: `id=eq.${batchId}`
        },
        (payload) => {
          console.log('Batch update:', payload);
          if (payload.new) {
            set(state => {
              const newBatches = new Map(state.activeBatches);
              const existing = newBatches.get(batchId);
              if (existing) {
                newBatches.set(batchId, {
                  ...existing,
                  ...payload.new,
                });
              }
              return { activeBatches: newBatches };
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'image_generations',
          filter: `batch_id=eq.${batchId}`
        },
        async (payload) => {
          console.log('Generation update:', payload);
          // Reload the batch to get updated items
          await get().loadBatch(batchId);
        }
      )
      .subscribe();
    
    set(state => {
      const newSubs = new Map(state.subscriptions);
      newSubs.set(batchId, channel);
      return { subscriptions: newSubs };
    });
  },

  // Unsubscribe from batch updates
  unsubscribeFromBatch: (batchId) => {
    const state = get();
    const channel = state.subscriptions.get(batchId);
    
    if (channel) {
      channel.unsubscribe();
      set(state => {
        const newSubs = new Map(state.subscriptions);
        newSubs.delete(batchId);
        return { subscriptions: newSubs };
      });
    }
  },

  // Unsubscribe from all
  unsubscribeAll: () => {
    const state = get();
    state.subscriptions.forEach(channel => channel.unsubscribe());
    set({ subscriptions: new Map() });
  },

  // Retry failed generations in a batch
  retryFailed: async (batchId) => {
    try {
      // Reset failed generations to pending
      const { error } = await supabase
        .from('image_generations')
        .update({ 
          status: 'pending',
          error_message: null,
          retry_count: 0
        })
        .eq('batch_id', batchId)
        .eq('status', 'failed');

      if (error) throw error;

      // Update batch status
      await supabase
        .from('batch_generations')
        .update({ 
          status: 'processing',
          failed_count: 0
        })
        .eq('id', batchId);

      // Trigger queue processing
      await supabase.functions.invoke('process-queue');
      
      // Reload batch
      await get().loadBatch(batchId);
      
    } catch (error) {
      console.error('Error retrying batch:', error);
      throw error;
    }
  },

  // Cancel a batch
  cancelBatch: async (batchId) => {
    try {
      // Update pending generations to cancelled
      await supabase
        .from('image_generations')
        .update({ status: 'failed', error_message: 'Cancelled by user' })
        .eq('batch_id', batchId)
        .in('status', ['pending']);

      // Update batch status
      await supabase
        .from('batch_generations')
        .update({ 
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', batchId);
      
      // Reload batch
      await get().loadBatch(batchId);
      
    } catch (error) {
      console.error('Error cancelling batch:', error);
      throw error;
    }
  },

  // Delete a batch and all its generations
  deleteBatch: async (batchId) => {
    try {
      // Delete will cascade to image_generations
      const { error } = await supabase
        .from('batch_generations')
        .delete()
        .eq('id', batchId);

      if (error) throw error;
      
      // Remove from state
      set(state => {
        const newBatches = new Map(state.activeBatches);
        newBatches.delete(batchId);
        return { 
          activeBatches: newBatches,
          currentBatch: state.currentBatch?.id === batchId ? null : state.currentBatch
        };
      });
      
      // Unsubscribe
      get().unsubscribeFromBatch(batchId);
      
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
    get().unsubscribeAll();
    set({
      activeBatches: new Map(),
      currentBatch: null,
      subscriptions: new Map(),
      isBatchModalOpen: false,
      isCreatingBatch: false
    });
  }
}));