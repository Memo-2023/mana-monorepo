import { IsString, IsNotEmpty, IsUUID, IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateBeatUploadDto {
	@IsUUID()
	@IsNotEmpty()
	projectId!: string;

	@IsString()
	@IsNotEmpty()
	filename!: string;
}

export class UpdateBeatMetadataDto {
	@IsNumber()
	@IsOptional()
	duration?: number;

	@IsNumber()
	@IsOptional()
	bpm?: number;

	@IsNumber()
	@IsOptional()
	bpmConfidence?: number;

	@IsObject()
	@IsOptional()
	waveformData?: {
		peaks: number[];
		sampleRate: number;
		duration: number;
	};
}
