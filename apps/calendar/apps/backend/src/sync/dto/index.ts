import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsUrl, IsBoolean } from 'class-validator';

export class ConnectCalendarDto {
	@IsString()
	name!: string;

	@IsEnum(['google', 'apple', 'caldav', 'ical_url'])
	provider!: 'google' | 'apple' | 'caldav' | 'ical_url';

	@IsUrl()
	calendarUrl!: string;

	@IsOptional()
	@IsString()
	username?: string;

	@IsOptional()
	@IsString()
	password?: string;

	@IsOptional()
	@IsString()
	accessToken?: string;

	@IsOptional()
	@IsString()
	refreshToken?: string;

	@IsOptional()
	@IsEnum(['import', 'export', 'both'])
	syncDirection?: 'import' | 'export' | 'both';

	@IsOptional()
	@IsInt()
	@Min(5)
	@Max(1440)
	syncInterval?: number;

	@IsOptional()
	@IsString()
	color?: string;
}

export class UpdateExternalCalendarDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsEnum(['import', 'export', 'both'])
	syncDirection?: 'import' | 'export' | 'both';

	@IsOptional()
	@IsInt()
	@Min(5)
	@Max(1440)
	syncInterval?: number;

	@IsOptional()
	@IsBoolean()
	syncEnabled?: boolean;

	@IsOptional()
	@IsString()
	color?: string;

	@IsOptional()
	@IsBoolean()
	isVisible?: boolean;
}

export class DiscoverCalDavDto {
	@IsUrl()
	serverUrl!: string;

	@IsString()
	username!: string;

	@IsString()
	password!: string;
}

export class GoogleOAuthCallbackDto {
	@IsString()
	code!: string;

	@IsOptional()
	@IsString()
	state?: string;
}
