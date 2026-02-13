import { IsUUID, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCheckoutSessionDto {
	@ApiProperty({ description: 'Plan ID to subscribe to' })
	@IsUUID()
	planId: string;

	@ApiProperty({ enum: ['month', 'year'], default: 'month' })
	@IsEnum(['month', 'year'])
	billingInterval: 'month' | 'year' = 'month';

	@ApiProperty({ description: 'URL to redirect to after successful payment' })
	@IsUrl()
	successUrl: string;

	@ApiProperty({ description: 'URL to redirect to if payment is canceled' })
	@IsUrl()
	cancelUrl: string;
}
