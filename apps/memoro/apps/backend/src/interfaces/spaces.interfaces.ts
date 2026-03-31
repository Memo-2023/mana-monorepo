export interface SpaceDto {
	id: string;
	name: string;
	owner_id: string;
	app_id: string;
	roles: any;
	credits: number;
	created_at: string;
	updated_at: string;
	memo_count?: number; // Added for compatibility with MemoroSpaceDto
}

export interface SpaceInviteDto {
	id: string;
	space_id: string;
	space?: SpaceDto;
	user_email: string;
	role: string;
	status: string;
	created_at: string;
	updated_at: string;
}

export interface PendingInvitesResponseDto {
	invites: SpaceInviteDto[];
}
