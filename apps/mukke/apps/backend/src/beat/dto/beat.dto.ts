import {
	IsString,
	IsNotEmpty,
	IsUUID,
	IsNumber,
	IsOptional,
	IsObject,
	MaxLength,
	Min,
	Max,
} from 'class-validator';

export class CreateBeatUploadDto {
	@IsUUID()
	@IsNotEmpty()
	projectId!: string;

	@IsString()
	@IsNotEmpty()
	@MaxLength(255)
	filename!: string;
}

export class UseLibraryBeatDto {
	@IsUUID()
	@IsNotEmpty()
	projectId!: string;
}

export class UpdateBeatMetadataDto {
	@IsNumber()
	@IsOptional()
	@Min(0)
	duration?: number;

	@IsNumber()
	@IsOptional()
	@Min(1)
	@Max(999)
	bpm?: number;

	@IsNumber()
	@IsOptional()
	@Min(0)
	@Max(1)
	bpmConfidence?: number;

	@IsObject()
	@IsOptional()
	waveformData?: {
		peaks: number[];
		sampleRate: number;
		duration: number;
	};
}
