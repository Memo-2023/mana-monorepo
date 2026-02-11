export interface EntityCount {
	entity: string;
	count: number;
	label: string;
}

export interface UserDataResponse {
	entities: EntityCount[];
	totalCount: number;
	lastActivityAt?: string;
}

export interface DeleteUserDataResponse {
	success: boolean;
	deletedCounts: EntityCount[];
	totalDeleted: number;
}
