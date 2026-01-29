// Matrix client exports
export { matrixStore } from './store.svelte';
export {
	loginWithPassword,
	loginWithToken,
	discoverHomeserver,
	checkHomeserver,
	register,
} from './client';
export * from './types';
export * from './crypto';
