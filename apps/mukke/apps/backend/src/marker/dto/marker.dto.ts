import {
	IsString,
	IsNotEmpty,
	IsUUID,
	IsNumber,
	IsOptional,
	IsIn,
	IsArray,
	ValidateNested,
	MaxLength,
	Min,
	ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

const MARKER_TYPES = [
	'verse',
	'hook',
	'bridge',
	'intro',
	'outro',
	'drop',
	'breakdown',
	'custom',
] as const;

export class CreateMarkerDto {
	@IsUUID()
	@IsNotEmpty()
	beatId!: string;

	@IsString()
	@IsIn(MARKER_TYPES)
	type!: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	label?: string;

	@IsNumber()
	@Min(0)
	startTime!: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	endTime?: number;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;
}

export class UpdateMarkerDto {
	@IsString()
	@IsIn(MARKER_TYPES)
	@IsOptional()
	type?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	label?: string;

	@IsNumber()
	@IsOptional()
	@Min(0)
	startTime?: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	endTime?: number;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;

	@IsNumber()
	@IsOptional()
	sortOrder?: number;
}

class MarkerItemDto {
	@IsString()
	@IsIn(MARKER_TYPES)
	type!: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	label?: string;

	@IsNumber()
	@Min(0)
	startTime!: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	endTime?: number;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;
}

export class BulkCreateMarkersDto {
	@IsUUID()
	@IsNotEmpty()
	beatId!: string;

	@IsArray()
	@ValidateNested({ each: true })
	@ArrayMaxSize(500)
	@Type(() => MarkerItemDto)
	markers!: MarkerItemDto[];
}

class MarkerUpdateItemDto {
	@IsUUID()
	@IsNotEmpty()
	id!: string;

	@ValidateNested()
	@Type(() => UpdateMarkerDto)
	data!: UpdateMarkerDto;
}

export class BulkUpdateMarkersDto {
	@IsArray()
	@ValidateNested({ each: true })
	@ArrayMaxSize(500)
	@Type(() => MarkerUpdateItemDto)
	updates!: MarkerUpdateItemDto[];
}
