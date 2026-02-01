// Matrix client exports
export { matrixStore } from './store.svelte';
export {
	loginWithPassword,
	loginWithToken,
	loginWithLoginToken,
	discoverHomeserver,
	checkHomeserver,
	register,
} from './client';
export * from './types';
export * from './crypto';
