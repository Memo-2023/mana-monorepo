import { useEffect, useRef, useCallback } from 'react';
import { TimeoutId } from '../types/timer.types';

/**
 * Custom hook for setTimeout with automatic cleanup
 * 
 * @param callback - Function to call after the delay
 * @param delay - Delay in milliseconds (null to disable)
 * 
 * @example
 * // Will automatically cleanup on unmount
 * useTimeout(() => {
 *   console.log('This runs after 1 second');
 * }, 1000);
 * 
 * // Conditional timeout
 * useTimeout(() => {
 *   showToast('Welcome!');
 * }, isFirstVisit ? 2000 : null);
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    if (delay === null) {
      return;
    }

    const timer = setTimeout(() => {
      savedCallback.current();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);
}

/**
 * Hook that returns functions to set and clear timeouts
 * Useful when you need more control over when timeouts are set
 * 
 * @example
 * const { setTimeout, clearTimeout } = useTimeoutFn();
 * 
 * const handleClick = () => {
 *   setTimeout(() => {
 *     console.log('Delayed action');
 *   }, 1000);
 * };
 */
export function useTimeoutFn() {
  const timeoutRef = useRef<TimeoutId | null>(null);

  const setTimeoutFn = useCallback((callback: () => void, delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(callback, delay);
  }, []);

  const clearTimeoutFn = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { setTimeout: setTimeoutFn, clearTimeout: clearTimeoutFn };
}