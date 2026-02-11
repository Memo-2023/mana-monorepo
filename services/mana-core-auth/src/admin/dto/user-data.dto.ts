export interface EntityCount {
	entity: string;
	count: number;
	label: string;
}

export interface ProjectDataSummary {
	projectId: string;
	projectName: string;
	icon: string;
	available: boolean;
	error?: string;
	entities: EntityCount[];
	totalCount: number;
	lastActivityAt?: string;
}

export interface UserDataSummary {
	user: {
		id: string;
		email: string;
		name: string;
		role: string;
		createdAt: string;
		emailVerified: boolean;
	};
	auth: {
		sessionsCount: number;
		accountsCount: number;
		has2FA: boolean;
		lastLoginAt: string | null;
	};
	credits: {
		balance: number;
		totalEarned: number;
		totalSpent: number;
		transactionsCount: number;
	};
	projects: ProjectDataSummary[];
	totals: {
		totalEntities: number;
		projectsWithData: number;
	};
}

export interface DeleteUserDataResponse {
	success: boolean;
	deletedFromProjects: {
		projectId: string;
		projectName: string;
		success: boolean;
		error?: string;
		deletedCount?: number;
	}[];
	deletedFromAuth: {
		sessions: number;
		accounts: number;
		credits: number;
		user: boolean;
	};
	totalDeleted: number;
}

export interface UserListItem {
	id: string;
	email: string;
	name: string;
	role: string;
	createdAt: string;
	lastActiveAt?: string;
}

export interface UserListResponse {
	users: UserListItem[];
	total: number;
	page: number;
	limit: number;
}
