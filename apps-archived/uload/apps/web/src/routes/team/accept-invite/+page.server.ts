import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return {
			result: {
				success: false,
				error: 'Invalid invitation link - no token provided',
			},
		};
	}

	if (!locals.user) {
		redirect(303, `/login?redirect=/team/accept-invite?token=${token}`);
	}

	try {
		// Find the invitation by token
		const invitation = await locals.pb
			.collection('shared_access')
			.getFirstListItem(`invitation_token="${token}" && invitation_status="pending"`, {
				expand: 'owner',
			});

		// Check if the invitation is for this user
		if (invitation.user !== locals.user.id) {
			return {
				result: {
					success: false,
					error: 'This invitation is not for your account',
				},
			};
		}

		// Accept the invitation
		await locals.pb.collection('shared_access').update(invitation.id, {
			invitation_status: 'accepted',
			accepted_at: new Date().toISOString(),
		});

		// Notification email will be sent automatically by PocketBase hook

		return {
			result: {
				success: true,
				message: 'Invitation accepted successfully',
			},
		};
	} catch (err: any) {
		console.error('Error accepting invitation:', err);

		// Check if invitation not found
		if (err?.status === 404) {
			return {
				result: {
					success: false,
					error: 'Invitation not found or already used',
				},
			};
		}

		return {
			result: {
				success: false,
				error: 'Failed to accept invitation. Please try again.',
			},
		};
	}
};
