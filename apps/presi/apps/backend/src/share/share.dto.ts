import { IsOptional, IsDateString } from 'class-validator';

export class CreateShareDto {
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
