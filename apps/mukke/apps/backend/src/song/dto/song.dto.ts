import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt } from 'class-validator';

export class CreateSongDto {
	@IsString()
	@IsNotEmpty()
	title!: string;

	@IsString()
	@IsOptional()
	artist?: string;

	@IsString()
	@IsOptional()
	album?: string;

	@IsString()
	@IsOptional()
	genre?: string;

	@IsInt()
	@IsOptional()
	trackNumber?: number;

	@IsInt()
	@IsOptional()
	year?: number;

	@IsNumber()
	@IsOptional()
	bpm?: number;
}

export class UpdateSongDto {
	@IsString()
	@IsOptional()
	title?: string;

	@IsString()
	@IsOptional()
	artist?: string;

	@IsString()
	@IsOptional()
	album?: string;

	@IsString()
	@IsOptional()
	albumArtist?: string;

	@IsString()
	@IsOptional()
	genre?: string;

	@IsInt()
	@IsOptional()
	trackNumber?: number;

	@IsInt()
	@IsOptional()
	year?: number;

	@IsNumber()
	@IsOptional()
	duration?: number;

	@IsNumber()
	@IsOptional()
	bpm?: number;

	@IsInt()
	@IsOptional()
	fileSize?: number;
}

export class SongUploadDto {
	@IsString()
	@IsNotEmpty()
	filename!: string;
}
