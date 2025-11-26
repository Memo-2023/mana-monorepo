export interface User {
	id: string;
	auth_id: string;
	email: string;
	first_name: string | null;
	last_name: string | null;
	avatar_url: string | null;
	credits: number;
	created_at: string;
	updated_at: string;
	subscription_plan_id: string | null;
	subscription_status: string | null;
	subscription_start_date: string | null;
	subscription_end_date: string | null;
	revenuecat_customer_id: string | null;
	app_settings: any;
	revenuecat_aliases: any;
	has_refunded: boolean;
	last_free_mana_grant: string | null;
	subscription_cancelled_at: string | null;
	billing_issue_detected_at: string | null;
	grace_period_ends_at: string | null;
}

export interface Organization {
	id: string;
	name: string;
	total_credits: number;
	used_credits: number;
	created_at: string;
	updated_at: string;
}

export interface Team {
	id: string;
	name: string;
	organization_id: string;
	allocated_credits: number;
	used_credits: number;
	created_at: string;
	updated_at: string;
	organization?: Organization;
}

export interface TeamMember {
	team_id: string;
	user_id: string;
	allocated_credits: number;
	used_credits: number;
	created_at: string;
	user?: User;
	team?: Team;
}

export interface UserRole {
	user_id: string;
	role_id: string;
	organization_id: string | null;
	team_id: string | null;
	created_at: string;
	role?: Role;
}

export interface Role {
	id: string;
	name: 'system_admin' | 'org_admin' | 'team_admin' | 'member';
	description: string | null;
}

export interface CreditTransaction {
	id: string;
	user_id: string;
	amount: number;
	description: string | null;
	app_id: string | null;
	created_at: string;
}

export interface OrganizationWithStats extends Organization {
	team_count: number;
	user_role?: string;
	available_credits: number;
}

export interface TeamWithStats extends Team {
	member_count: number;
	user_role?: string;
	available_credits: number;
}
