import {
	IsString,
	IsOptional,
	IsArray,
	ValidateNested,
	IsNumber,
	IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Local meal data from mobile app
 */
export class LocalMealDto {
	@IsNumber()
	localId: number;

	@IsOptional()
	@IsString()
	cloudId?: string;

	@IsString()
	foodName: string;

	@IsOptional()
	@IsString()
	imageUrl?: string;

	@IsOptional()
	calories?: number;

	@IsOptional()
	protein?: number;

	@IsOptional()
	carbohydrates?: number;

	@IsOptional()
	fat?: number;

	@IsOptional()
	fiber?: number;

	@IsOptional()
	sugar?: number;

	@IsOptional()
	sodium?: number;

	@IsOptional()
	@IsString()
	servingSize?: string;

	@IsOptional()
	@IsString()
	mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';

	@IsOptional()
	@IsString()
	analysisStatus?: string;

	@IsOptional()
	healthScore?: number;

	@IsOptional()
	@IsString()
	healthCategory?: string;

	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	userRating?: number;

	@IsOptional()
	foodItems?: any[];

	@IsNumber()
	version: number;

	@IsString()
	createdAt: string;

	@IsString()
	updatedAt: string;
}

/**
 * Push request - local changes to server
 */
export class SyncPushDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => LocalMealDto)
	meals: LocalMealDto[];

	@IsArray()
	@IsString({ each: true })
	deletedIds: string[];

	@IsOptional()
	@IsString()
	lastSyncAt?: string;
}

/**
 * Push response
 */
export interface SyncPushResponse {
	created: { localId: number; cloudId: string }[];
	updated: string[];
	conflicts: ConflictInfo[];
	serverTime: string;
}

/**
 * Conflict information
 */
export interface ConflictInfo {
	cloudId: string;
	localVersion: number;
	serverVersion: number;
	serverData: any;
	message: string;
}

/**
 * Pull query parameters
 */
export class SyncPullQueryDto {
	@IsOptional()
	@IsString()
	since?: string;
}

/**
 * Pull response
 */
export interface SyncPullResponse {
	meals: any[];
	deletedIds: string[];
	serverTime: string;
}

/**
 * Sync status response
 */
export interface SyncStatusResponse {
	lastSyncAt: string | null;
	pendingChanges: number;
	serverTime: string;
}
