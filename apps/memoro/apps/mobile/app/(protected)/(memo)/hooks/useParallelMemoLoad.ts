import { useEffect, useCallback } from 'react';

interface UseParallelMemoLoadProps {
  memoId: string | undefined;
  isValidId: boolean;
  loadMemoData: (id: string) => Promise<void>;
  loadTags: () => Promise<void>;
  loadMemoPhotos?: () => Promise<void>;
}

const debug = __DEV__ ? console.debug : () => {};

export function useParallelMemoLoad({
  memoId,
  isValidId,
  loadMemoData,
  loadTags,
  loadMemoPhotos,
}: UseParallelMemoLoadProps) {
  const loadAllData = useCallback(async () => {
    if (!isValidId || !memoId) return;
    
    const startTime = Date.now();
    debug(`Starting parallel memo load for ID: ${memoId}`);

    try {
      // Load all data in parallel
      const promises = [
        loadMemoData(memoId),
        loadTags(),
      ];

      // Only load photos if the function exists
      if (loadMemoPhotos) {
        promises.push(loadMemoPhotos());
      }

      await Promise.all(promises);
      
      const loadTime = Date.now() - startTime;
      debug(`All memo data loaded in ${loadTime}ms`);
    } catch (error) {
      debug('Error loading memo data in parallel:', error);
    }
  }, [memoId, isValidId, loadMemoData, loadTags, loadMemoPhotos]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return { refetchAll: loadAllData };
}