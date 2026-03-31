export interface CleanupResult {
	success: boolean;
	usersProcessed: number;
	filesDeleted: number;
	filesFailed: number;
	errors: CleanupError[];
	startedAt: string;
	completedAt: string;
}

export interface CleanupError {
	userId?: string;
	memoId?: string;
	filePath?: string;
	error: string;
}

export interface UserCleanupEnabledResponse {
	userIds: string[];
}
