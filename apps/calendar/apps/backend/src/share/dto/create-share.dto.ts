import {
	IsString,
	IsOptional,
	IsBoolean,
	IsIn,
	IsEmail,
	IsDateString,
	IsUUID,
} from 'class-validator';

export class CreateShareDto {
	@IsUUID()
	calendarId: string;

	@IsOptional()
	@IsEmail()
	email?: string;

	@IsIn(['read', 'write', 'admin'])
	permission: 'read' | 'write' | 'admin';

	@IsOptional()
	@IsBoolean()
	createLink?: boolean;

	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}
