import { IsUUID, IsOptional } from 'class-validator';

export class PurchaseCreditsDto {
  @IsUUID()
  packageId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
