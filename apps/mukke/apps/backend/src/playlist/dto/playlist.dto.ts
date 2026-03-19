import {
	IsString,
	IsNotEmpty,
	IsOptional,
	IsUUID,
	MaxLength,
	ArrayMaxSize,
	IsArray,
} from 'class-validator';

export class CreatePlaylistDto {
	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	name!: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	description?: string;
}

export class UpdatePlaylistDto {
	@IsString()
	@IsOptional()
	@MaxLength(255)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	description?: string;
}

export class AddSongDto {
	@IsUUID()
	@IsNotEmpty()
	songId!: string;
}

export class ReorderSongsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	@IsNotEmpty({ each: true })
	@ArrayMaxSize(1000)
	songIds!: string[];
}
