import { useEffect, useRef, DependencyList } from 'react';

/**
 * Custom hook for handling async operations in useEffect with proper cleanup
 * Prevents state updates on unmounted components
 * 
 * @param asyncFunction - The async function to run
 * @param deps - Dependency array for the effect
 * 
 * @example
 * useAsyncEffect(async (isMounted) => {
 *   const data = await fetchData();
 *   if (isMounted()) {
 *     setData(data);
 *   }
 * }, [id]);
 */
export function useAsyncEffect(
  asyncFunction: (isMounted: () => boolean) => Promise<void>,
  deps: DependencyList
) {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const isMounted = () => isMountedRef.current;
    
    // Execute the async function
    asyncFunction(isMounted).catch((error) => {
      if (isMounted()) {
        console.error('Error in useAsyncEffect:', error);
      }
    });

    return () => {
      isMountedRef.current = false;
    };
  }, deps);
}

/**
 * Alternative implementation that returns a cleanup function
 * 
 * @example
 * useAsyncEffectWithCleanup(async (signal) => {
 *   const response = await fetch(url, { signal });
 *   const data = await response.json();
 *   setData(data);
 * }, [url]);
 */
export function useAsyncEffectWithCleanup(
  asyncFunction: (signal: AbortSignal) => Promise<void>,
  deps: DependencyList
) {
  useEffect(() => {
    const abortController = new AbortController();
    
    asyncFunction(abortController.signal).catch((error) => {
      // Ignore abort errors
      if (error.name !== 'AbortError') {
        console.error('Error in useAsyncEffectWithCleanup:', error);
      }
    });

    return () => {
      abortController.abort();
    };
  }, deps);
}