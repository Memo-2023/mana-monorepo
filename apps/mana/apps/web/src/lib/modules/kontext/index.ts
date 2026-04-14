/**
 * Kontext module — barrel exports.
 */

export { kontextStore } from './stores/kontext.svelte';
export { useKontextDoc, toKontextDoc } from './queries';
export { kontextDocTable } from './collections';
export { KONTEXT_SINGLETON_ID } from './types';
export type { LocalKontextDoc, KontextDoc } from './types';
