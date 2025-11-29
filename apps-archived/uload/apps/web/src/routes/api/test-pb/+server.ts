import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		console.log('[TEST-PB] Testing PocketBase connection');
		console.log('[TEST-PB] PocketBase URL:', locals.pb?.baseUrl);
		console.log('[TEST-PB] PocketBase instance exists:', !!locals.pb);

		// Try to fetch health status
		const healthCheck = await fetch(`${locals.pb.baseUrl}/api/health`);
		const healthData = await healthCheck.json();

		console.log('[TEST-PB] Health check response:', healthData);

		// Try to list collections (public endpoint)
		try {
			const collections = await locals.pb.collections.getList(1, 1);
			console.log('[TEST-PB] Can access collections:', !!collections);
		} catch (e) {
			console.log('[TEST-PB] Cannot access collections (might be normal):', e.message);
		}

		return json({
			success: true,
			pocketbaseUrl: locals.pb?.baseUrl,
			health: healthData,
			timestamp: new Date().toISOString(),
		});
	} catch (error: any) {
		console.error('[TEST-PB] Error:', error);
		return json(
			{
				success: false,
				error: error.message,
				pocketbaseUrl: locals.pb?.baseUrl,
				timestamp: new Date().toISOString(),
			},
			{ status: 500 }
		);
	}
};
