import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { canAddTeamMembers, getTeamMemberLimit, DEFAULT_PERMISSIONS } from '$lib/types/accounts';
import type { SharedAccess } from '$lib/types/accounts';
import { sendTeamInvitationEmail, sendInvitationAcceptedEmail } from '$lib/email';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(303, '/login');
	}

	// Get team members for this account
	const teamMembers = await locals.pb.collection('shared_access').getList<SharedAccess>(1, 50, {
		filter: `owner="${locals.user.id}" && invitation_status="accepted"`,
		expand: 'user',
		sort: '-created',
	});

	// Get pending invitations for existing users
	const pendingInvites = await locals.pb.collection('shared_access').getList<SharedAccess>(1, 50, {
		filter: `owner="${locals.user.id}" && invitation_status="pending"`,
		expand: 'user',
		sort: '-created',
	});

	// Get pending invitations for new users
	const pendingNewUserInvites = await locals.pb.collection('pending_invitations').getList(1, 50, {
		filter: `owner="${locals.user.id}" && accepted_at = null && expires_at > "${new Date().toISOString()}"`,
		sort: '-created',
	});

	return {
		teamMembers: teamMembers.items,
		pendingInvites: pendingInvites.items,
		pendingNewUserInvites: pendingNewUserInvites.items,
	};
};

export const actions = {
	invite: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		// Everyone can invite team members, but check limits based on plan

		const data = await request.formData();
		const email = data.get('email') as string;

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		// Check team member limit based on subscription
		const teamLimit = getTeamMemberLimit(locals.user.subscription_status);
		const currentMembers = await locals.pb.collection('shared_access').getList(1, 1, {
			filter: `owner="${locals.user.id}" && (invitation_status="accepted" || invitation_status="pending")`,
		});

		if (teamLimit !== Infinity && currentMembers.totalItems >= teamLimit) {
			return fail(403, {
				error: `Team member limit reached. Your ${locals.user.subscription_status || 'free'} plan allows ${teamLimit} team member${teamLimit === 1 ? '' : 's'}.`,
			});
		}

		try {
			// Check if user exists
			let invitedUser;
			let isNewUser = false;

			try {
				invitedUser = await locals.pb.collection('users').getFirstListItem(`email="${email}"`);
			} catch {
				// User doesn't exist yet - we'll create a pending invitation
				isNewUser = true;
			}

			if (!isNewUser) {
				// Check if already invited
				const existing = await locals.pb.collection('shared_access').getList(1, 1, {
					filter: `owner="${locals.user.id}" && user="${invitedUser.id}"`,
				});

				if (existing.items.length > 0) {
					return fail(400, { error: 'This user already has access or is already invited' });
				}

				// Create the invitation for existing user
				const invitation = await locals.pb.collection('shared_access').create({
					owner: locals.user.id,
					user: invitedUser.id,
					permissions: DEFAULT_PERMISSIONS,
					invitation_token: generateInviteToken(),
					invitation_status: 'pending',
					invited_at: new Date().toISOString(),
				});

				// Email will be sent automatically by PocketBase hook

				return { success: true, message: 'Invitation sent successfully' };
			} else {
				// Create pending invitation for new user
				const token = generateInviteToken();
				const expiresAt = new Date();
				expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

				const invitation = await locals.pb.collection('pending_invitations').create({
					email,
					owner: locals.user.id,
					token,
					expires_at: expiresAt.toISOString(),
				});

				// Send invitation email
				const inviterName = locals.user.name || locals.user.username || locals.user.email;
				const emailSent = await sendTeamInvitationEmail(email, inviterName, token);

				if (!emailSent) {
					console.error('[TEAM] Failed to send invitation email to:', email);
				}

				return {
					success: true,
					message: 'Invitation sent! The user will need to create an account to join your team.',
				};
			}
		} catch (err: any) {
			console.error('Error inviting team member:', err);
			return fail(500, { error: 'Failed to send invitation' });
		}
	},

	remove: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const data = await request.formData();
		const memberId = data.get('memberId') as string;

		if (!memberId) {
			return fail(400, { error: 'Member ID is required' });
		}

		try {
			// Verify ownership
			const member = await locals.pb.collection('shared_access').getOne(memberId);
			if (member.owner !== locals.user.id) {
				return fail(403, { error: 'Not authorized' });
			}

			// Remove access
			await locals.pb.collection('shared_access').delete(memberId);

			return { success: true, message: 'Team member removed' };
		} catch (err: any) {
			console.error('Error removing team member:', err);
			return fail(500, { error: 'Failed to remove team member' });
		}
	},

	cancelInvite: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const data = await request.formData();
		const inviteId = data.get('inviteId') as string;

		if (!inviteId) {
			return fail(400, { error: 'Invite ID is required' });
		}

		try {
			// Verify ownership
			const invite = await locals.pb.collection('shared_access').getOne(inviteId);
			if (invite.owner !== locals.user.id) {
				return fail(403, { error: 'Not authorized' });
			}

			// Cancel invitation
			await locals.pb.collection('shared_access').delete(inviteId);

			return { success: true, message: 'Invitation cancelled' };
		} catch (err: any) {
			console.error('Error cancelling invitation:', err);
			return fail(500, { error: 'Failed to cancel invitation' });
		}
	},

	resend: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		const data = await request.formData();
		const inviteId = data.get('inviteId') as string;

		if (!inviteId) {
			return fail(400, { error: 'Invite ID is required' });
		}

		try {
			// Verify ownership
			const invite = await locals.pb.collection('shared_access').getOne(inviteId);
			if (invite.owner !== locals.user.id) {
				return fail(403, { error: 'Not authorized' });
			}

			// Update invitation with new token
			const newToken = generateInviteToken();
			await locals.pb.collection('shared_access').update(inviteId, {
				invitation_token: newToken,
				invited_at: new Date().toISOString(),
			});

			// Resend invitation email
			const inviterName = locals.user.name || locals.user.username || locals.user.email;
			const emailSent = await sendTeamInvitationEmail(invite.user.email, inviterName, newToken);

			if (!emailSent) {
				console.error('[TEAM] Failed to resend invitation email to:', invite.user.email);
			}

			return { success: true, message: 'Invitation resent' };
		} catch (err: any) {
			console.error('Error resending invitation:', err);
			return fail(500, { error: 'Failed to resend invitation' });
		}
	},
} satisfies Actions;

function generateInviteToken(): string {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let token = '';
	for (let i = 0; i < 32; i++) {
		token += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return token;
}
