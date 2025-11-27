import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		throw redirect(307, '/login');
	}

	console.log('=== DASHBOARD LOAD ===');
	console.log('Session user ID:', session.user.id);
	console.log('Session user email:', session.user.email);

	// Fetch user profile
	const { data: profile, error: profileError } = await supabase
		.from('users')
		.select('*')
		.eq('auth_id', session.user.id)
		.single();

	console.log('Profile query error:', profileError);
	console.log('Profile data:', JSON.stringify(profile, null, 2));

	// Count organizations
	const { count: organizationCount } = await supabase
		.from('user_roles')
		.select('organization_id', { count: 'exact', head: true })
		.eq('user_id', session.user.id)
		.not('organization_id', 'is', null);

	console.log('Organization count:', organizationCount);

	// Count teams
	const { count: teamCount } = await supabase
		.from('team_members')
		.select('team_id', { count: 'exact', head: true })
		.eq('user_id', session.user.id);

	console.log('Team count:', teamCount);
	console.log('======================\n');

	return {
		profile,
		organizationCount: organizationCount || 0,
		teamCount: teamCount || 0,
	};
};
