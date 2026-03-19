import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsNumber,
	IsInt,
	MaxLength,
	Min,
	Max,
} from 'class-validator';

export class CreateSongDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	title!: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	artist?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	album?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	genre?: string;

	@IsInt()
	@IsOptional()
	@Min(1)
	trackNumber?: number;

	@IsInt()
	@IsOptional()
	year?: number;

	@IsInt()
	@IsOptional()
	@Min(1)
	@Max(12)
	month?: number;

	@IsInt()
	@IsOptional()
	@Min(1)
	@Max(31)
	day?: number;

	@IsNumber()
	@IsOptional()
	@Min(1)
	@Max(999)
	bpm?: number;
}

export class UpdateSongDto {
	@IsString()
	@IsOptional()
	@MaxLength(255)
	title?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	artist?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	album?: string;

	@IsString()
	@IsOptional()
	@MaxLength(255)
	albumArtist?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	genre?: string;

	@IsInt()
	@IsOptional()
	@Min(1)
	trackNumber?: number;

	@IsInt()
	@IsOptional()
	year?: number;

	@IsInt()
	@IsOptional()
	@Min(1)
	@Max(12)
	month?: number;

	@IsInt()
	@IsOptional()
	@Min(1)
	@Max(31)
	day?: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	duration?: number;

	@IsNumber()
	@IsOptional()
	@Min(1)
	@Max(999)
	bpm?: number;

	@IsInt()
	@IsOptional()
	@Min(0)
	fileSize?: number;
}

export class SongUploadDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	filename!: string;

	@IsNumber()
	@IsOptional()
	fileLastModified?: number;
}
