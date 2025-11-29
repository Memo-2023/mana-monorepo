import { json } from '@sveltejs/kit';
import { validateUsername } from '$lib/username';
import type { RequestHandler } from './$types';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	const username = url.searchParams.get('username');

	if (!username) {
		return json({ available: false, error: 'Username required' });
	}

	// Validate format first
	const validation = validateUsername(username);
	if (!validation.valid) {
		return json({ available: false, error: validation.error });
	}

	try {
		// Try to find a user with this username using Drizzle ORM
		const [existingUser] = await locals.db
			.select()
			.from(users)
			.where(eq(users.username, username))
			.limit(1);

		// If no user found, username is available
		if (!existingUser) {
			return json({ available: true });
		}

		// Check if it's the current user (they're checking their temp username)
		if (locals.user && existingUser.id === locals.user.id) {
			// It's their own temporary username, so it's "available" for them
			return json({ available: true });
		}

		// Username taken by someone else
		return json({ available: false });
	} catch (err) {
		console.error('Error checking username:', err);
		return json({ available: false, error: 'Database error' }, { status: 500 });
	}
};
