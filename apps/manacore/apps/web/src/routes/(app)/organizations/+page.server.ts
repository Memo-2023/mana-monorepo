import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		throw redirect(307, '/login');
	}

	// Get all organizations where user has a role
	const { data: userRoles } = await supabase
		.from('user_roles')
		.select('organization_id, role_id, roles(name)')
		.eq('user_id', session.user.id)
		.not('organization_id', 'is', null);

	if (!userRoles || userRoles.length === 0) {
		return { organizations: [] };
	}

	const orgIds = userRoles.map((ur) => ur.organization_id);

	// Get organization details
	const { data: organizations } = await supabase.from('organizations').select('*').in('id', orgIds);

	if (!organizations) {
		return { organizations: [] };
	}

	// Count teams for each organization
	const orgsWithStats = await Promise.all(
		organizations.map(async (org) => {
			const { count: teamCount } = await supabase
				.from('teams')
				.select('id', { count: 'exact', head: true })
				.eq('organization_id', org.id);

			const userRole = userRoles.find((ur) => ur.organization_id === org.id);
			const roleName = userRole?.roles as any;

			return {
				...org,
				team_count: teamCount || 0,
				user_role: roleName?.name || 'member',
			};
		})
	);

	return {
		organizations: orgsWithStats,
	};
};
