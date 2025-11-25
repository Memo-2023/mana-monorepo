import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const isAdditional = url.searchParams.get('additional') === 'true';
	
	// Only redirect if user is logged in AND not trying to add additional account
	if (locals.user && !isAdditional) {
		redirect(303, '/my/links');
	}
	
	return {
		isAdditional
	};
};

export const actions = {
	login: async ({ request, locals, url }) => {
		const data = await request.formData();
		const email = data.get('email') as string;
		const password = data.get('password') as string;
		const isAdditional = url.searchParams.get('additional') === 'true';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);
			// Set the user in locals so it's available immediately
			locals.user = locals.pb.authStore.model;
		} catch (err) {
			// Login error occurred
			return fail(400, { error: 'Invalid email or password' });
		}

		// Handle redirect based on login type
		if (isAdditional) {
			// For additional accounts, show success message
			redirect(303, `/my?message=${encodeURIComponent('Account erfolgreich hinzugefügt! Du kannst nun zwischen deinen Accounts wechseln.')}&type=success`);
		} else {
			// Normal login flow
			redirect(303, '/my');
		}
	},

	logout: async ({ locals }) => {
		locals.pb.authStore.clear();
		redirect(303, '/');
	}
} satisfies Actions;
