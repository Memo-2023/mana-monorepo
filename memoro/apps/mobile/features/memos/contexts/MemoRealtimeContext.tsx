import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import memoRealtimeService, { MemoEventCallback } from '../services/memoRealtimeService';
import { useAuth } from '~/features/auth';
import { useMemoStore } from '../store/memoStore';

interface MemoRealtimeContextType {
  // Subscribe to all memo changes
  subscribeToAllMemos: (callback: MemoEventCallback) => () => void;
  
  // Subscribe to specific memo changes
  subscribeToMemo: (memoId: string, callback: MemoEventCallback) => () => void;
  
  // Subscribe to specific event types
  subscribeToEvent: (event: 'insert' | 'update' | 'delete', callback: MemoEventCallback) => () => void;
  
  // Get service status
  getStatus: () => { isInitialized: boolean; isInitializing: boolean; listenersCount: number };
}

const MemoRealtimeContext = createContext<MemoRealtimeContextType | null>(null);

export const useMemoRealtime = (): MemoRealtimeContextType => {
  const context = useContext(MemoRealtimeContext);
  if (!context) {
    throw new Error('useMemoRealtime must be used within a MemoRealtimeProvider');
  }
  return context;
};

// Internal component that subscribes to memo updates and updates the store
const MemoStoreUpdater: React.FC = () => {
  const updateMemo = useMemoStore(state => state.updateMemo);
  
  // Stable callback that only depends on updateMemo (which is stable)
  const handleMemoUpdate = useCallback((payload: any) => {
    console.log(`MemoStoreUpdater: Received ${payload.event} event`, {
      memoId: payload.new?.id || payload.old?.id,
      event: payload.event,
      title: payload.new?.title,
      metadata: payload.new?.metadata
    });
    
    if (payload.event === 'UPDATE' && payload.new) {
      console.log(`MemoStoreUpdater: Processing UPDATE for memo ${payload.new.id}`, {
        oldTitle: payload.old?.title,
        newTitle: payload.new?.title,
        titleChanged: payload.old?.title !== payload.new?.title,
        headlineStatus: payload.new?.metadata?.processing?.headline_and_intro?.status,
        timestamp: new Date().toISOString()
      });
      
      // Convert the database memo to the store format
      const updates = {
        title: payload.new.title,
        source: payload.new.source,
        metadata: payload.new.metadata,
        is_pinned: payload.new.is_pinned,
        tags: payload.new.tags,
        space: payload.new.space
      };
      
      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });
      
      console.log(`MemoStoreUpdater: Calling updateMemo with updates:`, {
        memoId: payload.new.id,
        hasTitle: !!updates.title,
        title: updates.title,
        timestamp: new Date().toISOString()
      });
      updateMemo(payload.new.id, updates);
    }
  }, [updateMemo]);
  
  // Use the optimized hook - no deps needed since the hook handles callback stability
  useAllMemoUpdates(handleMemoUpdate);
  
  return null;
};

interface MemoRealtimeProviderProps {
  children: React.ReactNode;
}

const MemoRealtimeProviderInner: React.FC<MemoRealtimeProviderProps> = ({ children }) => {
  const isInitializedRef = useRef(false);
  const { isAuthenticated, loading, user } = useAuth();

  // Initialize the service only when authenticated with a valid user
  useEffect(() => {
    let mounted = true;
    let initTimeout: ReturnType<typeof setTimeout> | null = null;
    
    // Don't initialize while auth is still loading or during token refresh cycles
    if (loading) {
      return;
    }

    // Only initialize if we have both authentication and a valid user object
    if (isAuthenticated && user && !isInitializedRef.current) {
      console.log('MemoRealtimeProvider: Initializing service (user authenticated with valid user object)');
      // Small delay to ensure token state is stable after fresh sign-in
      initTimeout = setTimeout(() => {
        if (mounted) {
          memoRealtimeService.initialize();
          isInitializedRef.current = true;
        }
      }, 100);
    } else if ((!isAuthenticated || !user) && isInitializedRef.current) {
      console.log('MemoRealtimeProvider: Cleaning up service (user not authenticated or no user object)');
      memoRealtimeService.cleanup();
      isInitializedRef.current = false;
    }

    // Cleanup when the provider unmounts or dependencies change
    return () => {
      mounted = false;
      
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      
      if (isInitializedRef.current) {
        console.log('MemoRealtimeProvider: Cleaning up service (component unmount or auth change)');
        memoRealtimeService.cleanup();
        isInitializedRef.current = false;
      }
    };
  }, [isAuthenticated, loading, user]);

  // Memoized context value to prevent unnecessary re-renders
  const contextValue = React.useMemo<MemoRealtimeContextType>(() => ({
    subscribeToAllMemos: (callback: MemoEventCallback) => {
      return memoRealtimeService.subscribeToAllMemos(callback);
    },
    
    subscribeToMemo: (memoId: string, callback: MemoEventCallback) => {
      return memoRealtimeService.subscribeToMemo(memoId, callback);
    },
    
    subscribeToEvent: (event: 'insert' | 'update' | 'delete', callback: MemoEventCallback) => {
      return memoRealtimeService.subscribeToEvent(event, callback);
    },
    
    getStatus: () => {
      return memoRealtimeService.getStatus();
    }
  }), []);

  return (
    <MemoRealtimeContext.Provider value={contextValue}>
      {children}
    </MemoRealtimeContext.Provider>
  );
};

// Hook for subscribing to all memo changes with automatic cleanup
export const useAllMemoUpdates = (callback: MemoEventCallback, deps: React.DependencyList = []) => {
  const { subscribeToAllMemos } = useMemoRealtime();
  
  // Store callback in a ref to avoid re-subscriptions when callback changes
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    // Use a stable wrapper that calls the current callback
    const stableCallback: MemoEventCallback = (payload) => {
      callbackRef.current(payload);
    };
    
    const unsubscribe = subscribeToAllMemos(stableCallback);
    return unsubscribe;
  }, [subscribeToAllMemos]); // Only re-subscribe when service changes
};

// Hook for subscribing to specific memo changes with automatic cleanup
export const useMemoUpdates = (memoId: string | null, callback: MemoEventCallback, deps: React.DependencyList = []) => {
  const { subscribeToMemo } = useMemoRealtime();
  
  // Store callback in a ref to avoid re-subscriptions when callback changes
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (!memoId) return;
    
    // Use a stable wrapper that calls the current callback
    const stableCallback: MemoEventCallback = (payload) => {
      callbackRef.current(payload);
    };
    
    const unsubscribe = subscribeToMemo(memoId, stableCallback);
    return unsubscribe;
  }, [memoId, subscribeToMemo]); // Only re-subscribe when memoId changes
};

// Hook for subscribing to specific event types with automatic cleanup
export const useEventUpdates = (event: 'insert' | 'update' | 'delete', callback: MemoEventCallback, deps: React.DependencyList = []) => {
  const { subscribeToEvent } = useMemoRealtime();
  
  // Store callback in a ref to avoid re-subscriptions when callback changes
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  useEffect(() => {
    // Use a stable wrapper that calls the current callback
    const stableCallback: MemoEventCallback = (payload) => {
      callbackRef.current(payload);
    };
    
    const unsubscribe = subscribeToEvent(event, stableCallback);
    return unsubscribe;
  }, [event, subscribeToEvent]); // Only re-subscribe when event type changes
};

// Public wrapper that includes both the provider and the store updater
export const MemoRealtimeProvider: React.FC<MemoRealtimeProviderProps> = ({ children }) => {
  return (
    <MemoRealtimeProviderInner>
      <MemoStoreUpdater />
      {children}
    </MemoRealtimeProviderInner>
  );
};

export default MemoRealtimeContext;