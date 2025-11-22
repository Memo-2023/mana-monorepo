import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		throw redirect(307, '/login');
	}

	const { data: profile } = await supabase
		.from('users')
		.select('*')
		.eq('auth_id', session.user.id)
		.single();

	return {
		profile
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals: { supabase, session } }) => {
		if (!session) {
			return fail(401, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const firstName = formData.get('firstName') as string;
		const lastName = formData.get('lastName') as string;

		const { error } = await supabase
			.from('users')
			.update({
				first_name: firstName,
				last_name: lastName,
				updated_at: new Date().toISOString()
			})
			.eq('auth_id', session.user.id);

		if (error) {
			console.error('Profile update error:', error);
			return fail(500, {
				error: 'Failed to update profile'
			});
		}

		return {
			success: true
		};
	}
};
