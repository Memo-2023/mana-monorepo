import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pb } from '$lib/pocketbase';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { featureRequestId, action } = await request.json();

	if (!featureRequestId || !action) {
		return json({ error: 'Invalid request' }, { status: 400 });
	}

	try {
		// Use admin client for updating vote counts
		const adminPb = new (await import('pocketbase')).default(pb.baseUrl);

		// Try to authenticate as admin using environment variables
		try {
			await adminPb.admins.authWithPassword(
				process.env.POCKETBASE_ADMIN_EMAIL || 'admin@example.com',
				process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456'
			);
		} catch (authError) {
			console.error('Admin auth failed, trying alternative approach');
			// If admin auth fails, we'll use the regular pb instance
		}

		if (action === 'add') {
			// Check if vote already exists
			const existingVotes = await pb.collection('featurevotes').getList(1, 1, {
				filter: `user_id = "${locals.user.id}" && feature_request_id = "${featureRequestId}"`,
			});

			if (existingVotes.items.length === 0) {
				// Create vote
				await pb.collection('featurevotes').create({
					user_id: locals.user.id,
					feature_request_id: featureRequestId,
				});

				// Get current vote count and increment
				const featureRequest = await pb.collection('featurerequests').getOne(featureRequestId);
				const newCount = (featureRequest.vote_count || 0) + 1;

				// Update using admin client if available, otherwise try regular
				const client = adminPb.authStore.isValid ? adminPb : pb;
				await client.collection('featurerequests').update(featureRequestId, {
					vote_count: newCount,
				});

				return json({ success: true, voteCount: newCount });
			}

			return json({ success: false, message: 'Already voted' });
		} else if (action === 'remove') {
			// Find and delete vote
			const existingVotes = await pb.collection('featurevotes').getList(1, 1, {
				filter: `user_id = "${locals.user.id}" && feature_request_id = "${featureRequestId}"`,
			});

			if (existingVotes.items.length > 0) {
				await pb.collection('featurevotes').delete(existingVotes.items[0].id);

				// Get current vote count and decrement
				const featureRequest = await pb.collection('featurerequests').getOne(featureRequestId);
				const newCount = Math.max(0, (featureRequest.vote_count || 0) - 1);

				// Update using admin client if available, otherwise try regular
				const client = adminPb.authStore.isValid ? adminPb : pb;
				await client.collection('featurerequests').update(featureRequestId, {
					vote_count: newCount,
				});

				return json({ success: true, voteCount: newCount });
			}

			return json({ success: false, message: 'No vote found' });
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Vote error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
