import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		throw redirect(307, '/login');
	}

	// Get all teams where user is a member
	const { data: teamMembers } = await supabase
		.from('team_members')
		.select('team_id, allocated_credits, used_credits')
		.eq('user_id', session.user.id);

	if (!teamMembers || teamMembers.length === 0) {
		return { teams: [] };
	}

	const teamIds = teamMembers.map((tm) => tm.team_id);

	// Get team details with organization info
	const { data: teams } = await supabase
		.from('teams')
		.select('*, organization:organizations(*)')
		.in('id', teamIds);

	if (!teams) {
		return { teams: [] };
	}

	// Check if user is team admin and count members
	const teamsWithStats = await Promise.all(
		teams.map(async (team) => {
			const { count: memberCount } = await supabase
				.from('team_members')
				.select('user_id', { count: 'exact', head: true })
				.eq('team_id', team.id);

			const { data: userRole } = await supabase
				.from('user_roles')
				.select('roles(name)')
				.eq('user_id', session.user.id)
				.eq('team_id', team.id)
				.single();

			const roleName = userRole?.roles as any;

			return {
				...team,
				member_count: memberCount || 0,
				user_role: roleName?.name || 'member'
			};
		})
	);

	return {
		teams: teamsWithStats
	};
};
