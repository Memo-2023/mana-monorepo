import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { generateUsernameFromEmail } from '$lib/username';
// Removed cardTemplateService import - using unified card system now
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Allow creating additional accounts - check if this is an explicit additional account creation
	const createAdditional = url.searchParams.get('additional') === 'true';
	
	// Only redirect if user is logged in AND not explicitly creating an additional account
	if (locals.user && !createAdditional) {
		redirect(303, '/my');
	}

	// Check for invitation token
	const inviteToken = url.searchParams.get('invite');
	if (inviteToken) {
		try {
			// Verify the invitation exists and is valid
			const invitation = await locals.pb.collection('pending_invitations').getFirstListItem(
				`token="${inviteToken}" && expires_at > "${new Date().toISOString()}" && accepted_at = null`,
				{ expand: 'owner' }
			);
			
			return {
				invitation: {
					token: inviteToken,
					email: invitation.email,
					inviterName: invitation.expand?.owner?.name || invitation.expand?.owner?.email || 'Someone'
				}
			};
		} catch (err) {
			// Invalid or expired invitation
			console.error('Invalid invitation:', err);
			return {
				invitation: null
			};
		}
	}

	return {
		invitation: null
	};
};

export const actions = {
	register: async ({ request, locals, url }) => {
		console.log('[REGISTER] Registration attempt started');
		console.log('[REGISTER] PocketBase instance exists:', !!locals.pb);
		console.log('[REGISTER] PocketBase URL:', locals.pb?.baseUrl);
		
		const formData = await request.formData();
		const email = (formData.get('email') as string)?.toLowerCase().trim();
		const password = formData.get('password') as string;
		const passwordConfirm = formData.get('passwordConfirm') as string;
		const inviteToken = formData.get('inviteToken') as string;
		const isAdditionalAccount = url.searchParams.get('additional') === 'true';
		
		console.log('[REGISTER] Form data received:', { email, hasPassword: !!password, isAdditionalAccount });

		// Basic validation
		if (!email || !password || !passwordConfirm) {
			return fail(400, { error: 'Email and password are required' });
		}

		// Email validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(400, { error: 'Please enter a valid email address' });
		}

		if (password !== passwordConfirm) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		// Don't set username during registration
		// User will set their username after first login
		// Registering user

		let newUser;
		try {
			// Create user with ONLY required fields
			// Username will be set later by the user
			// PocketBase now auto-generates IDs with the pattern [a-z0-9]{15}
			const userData: any = {
				email,
				password,
				passwordConfirm,
				emailVisibility: true
			};

			console.log('[REGISTER] Creating user with data:', { email, emailVisibility: true });
			console.log('[REGISTER] Using locals.pb:', !!locals.pb);
			console.log('[REGISTER] PocketBase URL:', locals.pb?.baseUrl);
			console.log('[REGISTER] Auth store valid:', locals.pb?.authStore?.isValid);
			console.log('[REGISTER] Password length:', password?.length);
			console.log('[REGISTER] Passwords match:', password === passwordConfirm);

			newUser = await locals.pb.collection('users').create(userData);
			console.log('[REGISTER] User created successfully:', newUser.id);

			// User created successfully
		} catch (err: any) {
			console.error('[REGISTER] Registration error:', err);
			console.error('[REGISTER] Error message:', err?.message);
			console.error('[REGISTER] Error response:', err?.response);
			console.error('[REGISTER] Error data:', err?.data);
			console.error('[REGISTER] Error stack:', err?.stack);

			// Check if locals.pb exists
			if (!locals.pb) {
				console.error('[REGISTER] CRITICAL: locals.pb is undefined!');
				return fail(500, { error: 'Server configuration error. Please try again later.' });
			}

			// Parse error response - PocketBase returns errors in different formats
			const errorData = err?.response?.data || err?.data || {};
			console.error('[REGISTER] Parsed error data:', JSON.stringify(errorData, null, 2));

			// Check if it's the nested data.id error (shouldn't happen anymore)
			if (errorData?.data?.id) {
				console.error('[REGISTER] ID validation error detected:', errorData.data.id);
				return fail(400, { 
					error: 'Registration configuration error. Please contact support.' 
				});
			}

			// Handle specific field errors
			if (!newUser && errorData.email?.message) {
				if (errorData.email.message.includes('unique')) {
					return fail(400, { error: 'This email is already registered. Please login instead.' });
				}
				return fail(400, { error: errorData.email.message });
			}

			// Check if it's a validation error
			if (errorData.password?.message) {
				return fail(400, { error: errorData.password.message });
			}

			// Handle missing fields error
			if (err?.message?.includes('validation_required')) {
				return fail(400, { error: 'Please fill in all required fields.' });
			}

			// Check for general validation errors
			if (err?.response?.message || err?.message) {
				const message = err?.response?.message || err?.message;
				console.error('[REGISTER] Error message:', message);

				// In development, show the actual error
				if (dev) {
					return fail(400, { 
						error: `Debug: ${message}`,
						details: err?.response?.data || err?.data
					});
				}

				// Don't expose internal errors to user in production
				if (message.includes('Failed to create record') || message.includes('validation')) {
					// But let's log the actual error for debugging
					console.error('[REGISTER] Actual PocketBase error:', message);
					console.error('[REGISTER] Full error object:', JSON.stringify(err, null, 2));
					return fail(400, {
						error: 'Registration failed. Please check your information and try again.'
					});
				}

				return fail(400, { error: message });
			}

			// Generic error handling
			console.error('[REGISTER] Unknown error type:', typeof err);
			console.error('[REGISTER] Full error:', JSON.stringify(err, null, 2));
			return fail(400, { error: 'Registration failed. Please try again.' });
		}

		// User created successfully

		// Handle invitation if present
		if (inviteToken && newUser) {
			try {
				// Find the pending invitation
				const invitation = await locals.pb.collection('pending_invitations').getFirstListItem(
					`token="${inviteToken}" && email="${email}" && expires_at > "${new Date().toISOString()}" && accepted_at = null`,
					{ expand: 'owner' }
				);

				// Create shared_access record
				await locals.pb.collection('shared_access').create({
					owner: invitation.owner,
					user: newUser.id,
					permissions: {
						can_create_links: true,
						can_edit_own_links: true,
						can_delete_own_links: true,
						can_view_analytics: false,
						can_manage_tags: false,
						can_export_data: false
					},
					invitation_status: 'accepted',
					accepted_at: new Date().toISOString()
				});

				// Mark invitation as accepted
				await locals.pb.collection('pending_invitations').update(invitation.id, {
					accepted_at: new Date().toISOString(),
					accepted_by: newUser.id
				});

				// Notification email will be sent automatically by PocketBase hook

				console.log('[REGISTER] Invitation accepted for user:', newUser.id);
			} catch (inviteErr) {
				console.error('[REGISTER] Failed to process invitation:', inviteErr);
				// Continue anyway - user is registered
			}
		}

		// Send verification email
		let verificationSent = false;
		try {
			await locals.pb.collection('users').requestVerification(email);
			verificationSent = true;
			console.log('[REGISTER] Verification email sent to:', email);
		} catch (emailErr) {
			console.error('[REGISTER] Failed to send verification email:', emailErr);
			// Continue anyway - user can request verification later
		}

		// Handle redirect based on registration type
		if (isAdditionalAccount) {
			// For additional accounts, redirect back to /my with message
			const message = verificationSent 
				? 'Account created! Please check your email to verify your new account.'
				: 'Account created! You can request a verification email from the settings page.';
			redirect(303, `/my?message=${encodeURIComponent(message)}&type=success`);
		} else {
			// For normal registration, redirect to login
			const redirectUrl = inviteToken 
				? '/login?registered=true&invited=true&email=' + encodeURIComponent(email)
				: '/login?registered=true&email=' + encodeURIComponent(email);
			redirect(303, redirectUrl);
		}
	}
} satisfies Actions;
