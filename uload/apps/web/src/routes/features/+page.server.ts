import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Load published feature requests
	let featureRequestsList = [];
	let userVotes = [];

	try {
		// Get all published feature requests, sorted by vote count
		console.log('Loading feature requests...');
		const response = await locals.pb.collection('featurerequests').getList(1, 50, {
			filter: 'published = true',
			sort: '-vote_count'
		});

		featureRequestsList = response.items || [];
		console.log('Found feature requests:', response.totalItems, 'total');
		console.log('Feature requests loaded:', featureRequestsList.length);

		if (featureRequestsList.length > 0) {
			console.log('First feature request:', featureRequestsList[0]);
		}

		// If user is logged in, get their votes
		if (locals.user) {
			userVotes = await locals.pb.collection('featurevotes').getFullList({
				filter: `user_id = "${locals.user.id}"`,
				fields: 'feature_request_id'
			});
			console.log('User votes:', userVotes.length);
		}
	} catch (error) {
		console.error('Error loading feature requests:', error);
	}

	return {
		user: locals.user,
		featureRequests: featureRequestsList,
		userVotedIds: userVotes.map((v) => v.feature_request_id)
	};
};

export const actions: Actions = {
	requestFeature: async ({ request, locals }) => {
		const formData = await request.formData();
		const message = formData.get('message')?.toString();
		const name = formData.get('name')?.toString() || '';
		const email = formData.get('email')?.toString() || '';

		if (!message) {
			return fail(400, { error: 'Bitte gib eine Nachricht ein.' });
		}

		try {
			// Save feature request to PocketBase
			const featureRequest = await locals.pb.collection('featurerequests').create({
				message,
				name: name || null,
				email: email || null,
				status: 'new'
			});

			console.log('Feature request saved:', featureRequest.id);
			if (name || email) {
				console.log(`From: ${name || 'Anonymous'} ${email ? `(${email})` : ''}`);
			}
			console.log(`Message: ${message}`);

			return { success: true };
		} catch (error) {
			console.error('Error saving feature request:', error);
			return fail(500, {
				error: 'Es gab ein Problem beim Speichern deiner Anfrage. Bitte versuche es später erneut.'
			});
		}
	},

	vote: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Du musst angemeldet sein, um abzustimmen.' });
		}

		const formData = await request.formData();
		const featureRequestId = formData.get('featureRequestId')?.toString();
		const action = formData.get('action')?.toString(); // 'add' or 'remove'

		if (!featureRequestId || !action) {
			return fail(400, { error: 'Ungültige Anfrage.' });
		}

		try {
			if (action === 'add') {
				// Try to create vote - PocketBase Hook will handle vote_count update
				// The hook also prevents duplicate votes
				await locals.pb.collection('featurevotes').create({
					user_id: locals.user.id,
					feature_request_id: featureRequestId
				});
				console.log('Vote created successfully');
			} else if (action === 'remove') {
				// Find and delete vote - PocketBase Hook will handle vote_count update
				const existingVotes = await locals.pb.collection('featurevotes').getList(1, 1, {
					filter: `user_id = "${locals.user.id}" && feature_request_id = "${featureRequestId}"`
				});

				if (existingVotes.items.length > 0) {
					await locals.pb.collection('featurevotes').delete(existingVotes.items[0].id);
					console.log('Vote removed successfully');
				}
			}

			return { voteSuccess: true };
		} catch (error) {
			console.error('Error processing vote:', error);
			// Check if it's a duplicate vote error
			if (error.message?.includes('already voted')) {
				return fail(400, { error: 'Du hast bereits für dieses Feature abgestimmt.' });
			}
			return fail(500, { error: 'Es gab ein Problem beim Verarbeiten deiner Stimme.' });
		}
	}
};
