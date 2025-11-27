// Simplified Account Types for Team Collaboration

export interface User {
	id: string;
	email: string;
	username: string;
	name?: string;
	avatar?: string;
	bio?: string;
	location?: string;
	website?: string;
	github?: string;
	twitter?: string;
	linkedin?: string;
	instagram?: string;
	showClickStats?: boolean;
	subscription_status?: 'free' | 'pro' | 'team' | 'team_plus' | 'cancelled' | 'past_due';
	stripe_customer_id?: string;
	stripe_subscription_id?: string;
	current_period_end?: string;
	links_created_this_month?: number;
	monthly_reset_date?: string;
	team_members_count?: number;
	created: string;
	updated: string;
	verified?: boolean;
}

// Shared access for team collaboration
export interface SharedAccess {
	id: string;
	owner: string; // User who owns the account
	user: string; // User who has access
	permissions?: TeamPermissions;
	invitation_token?: string;
	invitation_status?: 'pending' | 'accepted' | 'declined';
	invited_at?: string;
	accepted_at?: string;
	created: string;
	updated: string;
	expand?: {
		owner?: User;
		user?: User;
	};
}

// Team member permissions
export interface TeamPermissions {
	view_stats: boolean;
	create_links: boolean;
	edit_own: boolean;
	delete_own: boolean;
	manage_team?: boolean; // Only for team admins
}

// Default permissions for new team members
export const DEFAULT_PERMISSIONS: TeamPermissions = {
	view_stats: true,
	create_links: true,
	edit_own: true,
	delete_own: true,
	manage_team: false,
};

// Subscription plans with updated limits
export const SUBSCRIPTION_PLANS = {
	free: {
		name: 'Free',
		price: 0,
		currency: 'EUR',
		team_members: 1, // Can invite 1 team member
		links_per_month: 10, // Updated to match pricing page
		features: [
			'10 links per month',
			'1 team member',
			'Basic Analytics',
			'QR Codes',
			'Link Customization',
		],
	},
	pro: {
		name: 'Pro Monthly',
		price: 4.99,
		currency: 'EUR',
		team_members: 3, // Can invite up to 3 team members
		links_per_month: 300, // Updated to match pricing page
		features: [
			'300 links per month',
			'Up to 3 team members',
			'Advanced Analytics',
			'Custom QR Codes',
			'Priority Support',
		],
	},
	team: {
		name: 'Pro Yearly',
		price: 39.99,
		currency: 'EUR',
		team_members: 5, // Can invite up to 5 team members
		links_per_month: 600, // Updated to match pricing page (yearly = 600/month)
		features: [
			'600 links per month',
			'Up to 5 team members',
			'Advanced Analytics',
			'Custom QR Codes',
			'Priority Support',
		],
	},
	team_plus: {
		name: 'Pro Lifetime',
		price: 129.99,
		currency: 'EUR',
		team_members: -1, // unlimited team members
		links_per_month: -1, // unlimited
		features: [
			'Unlimited links',
			'Unlimited team members',
			'All Pro Features',
			'API Access',
			'Early Access to new Features',
		],
	},
};

// Helper to check if user can add team members (now everyone can)
export function canAddTeamMembers(subscription_status?: string): boolean {
	return true; // Everyone can invite team members
}

// Helper to get team member limit
export function getTeamMemberLimit(subscription_status?: string): number {
	if (!subscription_status || !(subscription_status in SUBSCRIPTION_PLANS)) {
		return SUBSCRIPTION_PLANS.free.team_members; // Default to free plan limit
	}
	const limit =
		SUBSCRIPTION_PLANS[subscription_status as keyof typeof SUBSCRIPTION_PLANS].team_members;
	return limit === -1 ? Infinity : limit; // -1 means unlimited
}

// Helper to get links per month limit
export function getLinksPerMonthLimit(subscription_status?: string): number {
	if (!subscription_status || !(subscription_status in SUBSCRIPTION_PLANS)) {
		return SUBSCRIPTION_PLANS.free.links_per_month;
	}
	return SUBSCRIPTION_PLANS[subscription_status as keyof typeof SUBSCRIPTION_PLANS].links_per_month;
}
