import {
	IsString,
	IsNumber,
	IsOptional,
	IsArray,
	ValidateNested,
	IsInt,
	Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrUpdateLyricsDto {
	@IsString()
	content!: string;
}

class LyricLineDto {
	@IsInt()
	@Min(0)
	lineNumber!: number;

	@IsString()
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
