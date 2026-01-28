import { IsString, IsNotEmpty, IsIn, IsOptional, Matches } from 'class-validator';

export class RegisterTokenDto {
	@IsString()
	@IsNotEmpty()
	@Matches(/^ExponentPushToken\[.+\]$/, {
		message: 'pushToken must be a valid Expo push token',
	})
	pushToken: string;

	@IsString()
	@IsIn(['ios', 'android'])
	platform: 'ios' | 'android';

	@IsOptional()
	@IsString()
	deviceName?: string;
}
