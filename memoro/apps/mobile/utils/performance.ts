/**
 * Performance utilities for optimizing function execution
 */

/**
 * Creates a throttled function that only invokes the provided function at most once
 * per every `wait` milliseconds. The throttled function comes with a `cancel` method
 * to cancel delayed invocations.
 * 
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @param options - Options object
 * @param options.leading - Specify invoking on the leading edge of the timeout
 * @param options.trailing - Specify invoking on the trailing edge of the timeout
 * @returns The throttled function with a `cancel` method
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let lastCallTime = 0;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: any;

  const { leading = true, trailing = true } = options;

  const invokeFunc = () => {
    if (lastArgs && lastThis) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  };

  const throttled = function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastCallTime);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      lastCallTime = now;
      if (leading) {
        invokeFunc();
      }
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        lastCallTime = Date.now();
        timeout = null;
        invokeFunc();
      }, remaining);
    }

    return result;
  } as T;

  throttled.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  return throttled;
}

/**
 * Creates a debounced function that delays invoking the provided function until
 * after `wait` milliseconds have elapsed since the last time it was invoked.
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns The debounced function with a `cancel` method
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: any;

  const debounced = function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    lastThis = this;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      if (lastArgs && lastThis) {
        result = func.apply(lastThis, lastArgs);
        lastArgs = null;
        lastThis = null;
      }
      timeout = null;
    }, wait);

    return result;
  } as T;

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  return debounced;
}