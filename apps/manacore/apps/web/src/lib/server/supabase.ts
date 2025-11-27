import type { RequestEvent } from '@sveltejs/kit';

export async function getUser(event: RequestEvent) {
	const {
		data: { user },
		error,
	} = await event.locals.supabase.auth.getUser();

	if (error) {
		console.error('Error fetching user:', error);
		return null;
	}

	return user;
}

export async function getSession(event: RequestEvent) {
	const {
		data: { session },
		error,
	} = await event.locals.supabase.auth.getSession();

	if (error) {
		console.error('Error fetching session:', error);
		return null;
	}

	return session;
}

export async function requireAuth(event: RequestEvent) {
	const session = await getSession(event);

	if (!session) {
		throw new Error('Unauthorized');
	}

	return session;
}

export function getSupabaseServerClient(event: RequestEvent) {
	return event.locals.supabase;
}
