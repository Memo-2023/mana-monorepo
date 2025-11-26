/**
 * Simple logger utility for debugging auth flows
 */

const PREFIX = '[ManaAuth]';

export const debug = (...args: any[]) => {
  if (__DEV__) {
    console.debug(PREFIX, ...args);
  }
};

export const info = (...args: any[]) => {
  console.log(PREFIX, ...args);
};

export const warn = (...args: any[]) => {
  console.warn(PREFIX, ...args);
};

export const error = (...args: any[]) => {
  console.error(PREFIX, ...args);
};
