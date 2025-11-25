import { error } from '@sveltejs/kit';
import type { Link, Click } from '$lib/pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;
	
	console.log('[Analytics] Loading analytics for ID/short_code:', id);
	console.log('[Analytics] User:', locals.user?.id, locals.user?.email);

	// Check if user is authenticated
	if (!locals.user) {
		console.log('[Analytics] User not authenticated');
		error(401, 'You must be logged in to view analytics');
	}

	try {
		// Try to get link by ID first, then by short_code if ID fails
		let link;
		try {
			console.log('[Analytics] Trying to fetch by ID:', id);
			link = await locals.pb.collection('links').getOne<Link>(id);
			console.log('[Analytics] Found link by ID');
		} catch (e) {
			console.log('[Analytics] Not found by ID, trying by short_code:', id);
			// If not found by ID, try by short_code
			const linkList = await locals.pb.collection('links').getList(1, 1, {
				filter: `short_code="${id}"`
			});
			console.log('[Analytics] Search by short_code result:', linkList.items.length, 'items');
			if (linkList.items.length === 0) {
				console.log('[Analytics] Link not found by short_code either');
				error(404, 'Link not found');
			}
			link = linkList.items[0];
			console.log('[Analytics] Found link by short_code:', link.id);
		}

		// Check if user owns the link (check both user_id and created_by)
		console.log('[Analytics] Checking ownership - Link user_id:', link.user_id, 'created_by:', link.created_by);
		console.log('[Analytics] Current user ID:', locals.user.id);
		if (link.user_id !== locals.user.id && link.created_by !== locals.user.id) {
			console.log('[Analytics] Access denied - user does not own this link');
			error(403, 'You do not have access to this link');
		}
		console.log('[Analytics] Access granted');

		const clicks = await locals.pb.collection('analytics').getList(1, 500, {
			filter: `link="${link.id}"`,
			sort: '-created'
		});

		// Helper function to extract browser from user agent
		function getBrowserFromUserAgent(userAgent: string): string {
			if (!userAgent) return 'Unknown';
			if (userAgent.includes('Chrome')) return 'Chrome';
			if (userAgent.includes('Firefox')) return 'Firefox';
			if (userAgent.includes('Safari')) return 'Safari';
			if (userAgent.includes('Edge')) return 'Edge';
			if (userAgent.includes('Opera')) return 'Opera';
			return 'Other';
		}

		const browserStats = clicks.items.reduce(
			(acc, click) => {
				const browser = getBrowserFromUserAgent(click.user_agent || '');
				acc[browser] = (acc[browser] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const deviceStats = clicks.items.reduce(
			(acc, click) => {
				const device = click.device || 'Unknown';
				acc[device] = (acc[device] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const refererStats = clicks.items.reduce(
			(acc, click) => {
				if (click.referer) {
					try {
						const url = new URL(click.referer);
						const domain = url.hostname;
						acc[domain] = (acc[domain] || 0) + 1;
					} catch {
						acc['Direct'] = (acc['Direct'] || 0) + 1;
					}
				} else {
					acc['Direct'] = (acc['Direct'] || 0) + 1;
				}
				return acc;
			},
			{} as Record<string, number>
		);

		const clicksByDay = clicks.items.reduce(
			(acc, click) => {
				const date = new Date(click.created).toLocaleDateString();
				acc[date] = (acc[date] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		const clicksByHour = clicks.items.reduce(
			(acc, click) => {
				const hour = new Date(click.created).getHours();
				acc[hour] = (acc[hour] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		return {
			link,
			totalClicks: clicks.totalItems,
			recentClicks: clicks.items.slice(0, 10),
			browserStats: Object.entries(browserStats).sort((a, b) => b[1] - a[1]),
			deviceStats: Object.entries(deviceStats).sort((a, b) => b[1] - a[1]),
			refererStats: Object.entries(refererStats)
				.sort((a, b) => b[1] - a[1])
				.slice(0, 10),
			clicksByDay: Object.entries(clicksByDay).sort(
				(a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()
			),
			clicksByHour: Array.from({ length: 24 }, (_, i) => [i.toString(), clicksByHour[i] || 0])
		};
	} catch (err) {
		console.log('[Analytics] Error occurred:', err);
		error(404, 'Link not found');
	}
};
