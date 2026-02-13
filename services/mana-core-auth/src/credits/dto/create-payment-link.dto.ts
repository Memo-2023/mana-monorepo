import { IsUUID, IsOptional, IsUrl, IsString } from 'class-validator';

export class CreatePaymentLinkDto {
	@IsUUID()
	packageId: string;

	@IsOptional()
	@IsUrl()
	successUrl?: string;

	@IsOptional()
	@IsUrl()
	cancelUrl?: string;

	@IsOptional()
	@IsString()
	roomId?: string; // For Matrix bot notification after payment
}
