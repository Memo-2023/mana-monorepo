import {
	IsString,
	IsNumber,
	IsOptional,
	IsArray,
	ValidateNested,
	IsInt,
	Min,
	MaxLength,
	ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrUpdateLyricsDto {
	@IsString()
	@MaxLength(50000)
	content!: string;
}

class LyricLineDto {
	@IsInt()
	@Min(0)
	lineNumber!: number;

	@IsString()
	@MaxLength(1000)
	text!: string;

	@IsNumber()
	@IsOptional()
	@Min(0)
	startTime?: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	endTime?: number;
}

export class SyncLinesDto {
	@IsArray()
	@ValidateNested({ each: true })
	@ArrayMaxSize(2000)
	@Type(() => LyricLineDto)
	lines!: LyricLineDto[];
}

export class UpdateLineTimestampDto {
	@IsNumber()
	@IsOptional()
	@Min(0)
	startTime?: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	endTime?: number;
}
