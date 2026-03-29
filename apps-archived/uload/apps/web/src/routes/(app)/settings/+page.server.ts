import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	return {
		user: locals.user,
		avatarUrl: locals.user?.avatar ? locals.pb.getFileUrl(locals.user, locals.user.avatar) : null,
	};
};

export const actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const name = data.get('name') as string;
		const email = data.get('email') as string;
		const bio = data.get('bio') as string;
		const location = data.get('location') as string;
		const website = data.get('website') as string;
		const github = data.get('github') as string;
		const twitter = data.get('twitter') as string;
		const linkedin = data.get('linkedin') as string;
		const instagram = data.get('instagram') as string;
		const profileBackground = data.get('profileBackground') as string;
		const avatar = data.get('avatar') as File;

		// Card customization colors
		const cardBackground = data.get('cardBackground') as string;
		const cardBorder = data.get('cardBorder') as string;
		const cardLinks = data.get('cardLinks') as string;
		const cardText = data.get('cardText') as string;

		try {
			// Prepare card customization JSON
			const cardCustomization = {
				cardBackgroundColor: cardBackground || '#ffffff',
				cardBorderColor: cardBorder || '#e2e8f0',
				cardLinkColor: cardLinks || '#0ea5e9',
				cardTextColor: cardText || '#0f172a',
			};

			// Prepare update data
			const updateData: any = {
				name: name || '',
				email: email || locals.user.email,
				bio: bio || '',
				location: location || '',
				website: website || '',
				github: github || '',
				twitter: twitter || '',
				linkedin: linkedin || '',
				instagram: instagram || '',
				profileBackground: profileBackground || '',
				cardCustomization: JSON.stringify(cardCustomization),
			};

			// Add avatar if a new file was uploaded
			if (avatar && avatar.size > 0) {
				updateData.avatar = avatar;
			}

			// Use the pb instance from locals which has the correct auth
			const updatedUser = await locals.pb.collection('users').update(locals.user.id, updateData);

			locals.user = updatedUser;

			return {
				success: true,
				message: 'Profile updated successfully',
			};
		} catch (err) {
			console.error('Profile update error:', err);
			console.error('User ID:', locals.user.id);
			console.error('Auth valid:', locals.pb.authStore.isValid);
			return fail(400, { error: `Failed to update profile: ${err.message || err}` });
		}
	},

	updatePassword: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'All password fields are required' });
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'New passwords do not match' });
		}

		if (newPassword.length < 8) {
			return fail(400, { passwordError: 'Password must be at least 8 characters long' });
		}

		try {
			// First authenticate with current password to verify it's correct
			await locals.pb.collection('users').authWithPassword(locals.user.email, currentPassword);

			// Update the password
			await locals.pb.collection('users').update(locals.user.id, {
				password: newPassword,
				passwordConfirm: confirmPassword,
			});

			return {
				passwordSuccess: true,
				passwordMessage: 'Password updated successfully',
			};
		} catch (err) {
			return fail(400, { passwordError: 'Current password is incorrect' });
		}
	},

	updatePreferences: async ({ request, locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		const data = await request.formData();
		const emailNotifications = data.get('emailNotifications') === 'on';
		const publicProfile = data.get('publicProfile') === 'on';
		const showClickStats = data.get('showClickStats') === 'on';
		const defaultExpiry = data.get('defaultExpiry') as string;

		try {
			await locals.pb.collection('users').update(locals.user.id, {
				emailNotifications,
				publicProfile,
				showClickStats,
				defaultExpiry: defaultExpiry ? parseInt(defaultExpiry) : null,
			});

			return {
				preferencesSuccess: true,
				preferencesMessage: 'Preferences updated successfully',
			};
		} catch (err) {
			return fail(400, { preferencesError: 'Failed to update preferences' });
		}
	},

	deleteAccount: async ({ locals }) => {
		if (!locals.user) {
			redirect(302, '/login');
		}

		try {
			// Delete all user's links first
			const links = await locals.pb.collection('links').getFullList({
				filter: `user_id="${locals.user.id}"`,
			});

			for (const link of links) {
				await locals.pb.collection('links').delete(link.id);
			}

			// Delete the user account
			await locals.pb.collection('users').delete(locals.user.id);

			// Clear the auth store
			locals.pb.authStore.clear();
			locals.user = null;

			redirect(302, '/');
		} catch (err) {
			return fail(400, { deleteError: 'Failed to delete account' });
		}
	},
} satisfies Actions;
