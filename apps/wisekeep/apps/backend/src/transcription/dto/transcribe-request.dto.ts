import { IsString, IsOptional, IsUrl, IsEnum } from 'class-validator';

export enum WhisperProviderEnum {
  GROQ = 'groq',
  LOCAL = 'local',
}

export enum WhisperModelEnum {
  // Groq models (cloud)
  WHISPER_LARGE_V3_TURBO = 'whisper-large-v3-turbo',
  WHISPER_LARGE_V3 = 'whisper-large-v3',
  // Local models
  TINY = 'tiny',
  BASE = 'base',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export class TranscribeRequestDto {
  @IsUrl()
  url: string;

  @IsString()
  @IsOptional()
  language?: string = 'de';

  @IsEnum(WhisperProviderEnum)
  @IsOptional()
  provider?: WhisperProviderEnum;

  @IsEnum(WhisperModelEnum)
  @IsOptional()
  model?: WhisperModelEnum;
}
