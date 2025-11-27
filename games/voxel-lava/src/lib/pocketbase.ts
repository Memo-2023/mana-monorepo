import PocketBase from 'pocketbase';

// PocketBase Instanz mit deiner Domain
export const pb = new PocketBase('https://pb.voxelava.com');

// Auto-refresh für Auth Token
pb.authStore.onChange(() => {
	// Token wird automatisch erneuert
});

// Optional: SSR Support für SvelteKit
export function createPocketBase() {
	return new PocketBase('https://pb.voxelava.com');
}