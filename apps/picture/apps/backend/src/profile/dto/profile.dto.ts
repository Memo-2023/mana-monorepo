import { IsString, IsOptional, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
	@IsOptional()
	@IsString()
	@MinLength(2)
	@MaxLength(50)
	username?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	avatarUrl?: string;
}

export interface ProfileResponse {
	id: string;
	username: string | null;
	email: string;
	avatarUrl: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserStatsResponse {
	totalImages: number;
	favoriteImages: number;
	archivedImages: number;
	publicImages: number;
}
