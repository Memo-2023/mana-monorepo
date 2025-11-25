import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// This will be populated by hooks.server.ts
	// For now, we'll use a simple client-side check
	// TODO: Implement proper SSR auth in hooks.server.ts

	return {};
};
