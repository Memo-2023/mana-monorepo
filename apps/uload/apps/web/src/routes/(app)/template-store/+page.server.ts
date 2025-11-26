import type { PageServerLoad } from './$types';
import type { Card } from '$lib/components/cards/types';

export const load: PageServerLoad = async ({ locals }) => {
	// Fetch templates on the server
	let templates: Card[] = [];
	
	try {
		// Fetch all public templates
		const records = await locals.pb.collection('cards').getList(1, 100, {
			filter: `type="template" && visibility="public"`,
			sort: '-created'
		});
		
		templates = records.items as unknown as Card[];
	} catch (error) {
		console.error('Failed to fetch templates on server:', error);
		// Return empty array on error, client will try to fetch again
	}
	
	return {
		user: locals.user,
		templates
	};
};