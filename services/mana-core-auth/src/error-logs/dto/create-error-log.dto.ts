import {
	IsString,
	IsOptional,
	MaxLength,
	IsEnum,
	IsObject,
	IsInt,
	IsISO8601,
	Min,
	Max,
} from 'class-validator';

export class CreateErrorLogDto {
	// Required fields
	@IsString()
	@MaxLength(100)
	errorCode: string;

	@IsString()
	@MaxLength(100)
	errorType: string;

	@IsString()
	@MaxLength(5000)
	message: string;

	// Optional fields
	@IsString()
	@IsOptional()
	@MaxLength(50000)
	stackTrace?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	appId?: string;

	@IsEnum(['backend', 'frontend_web', 'frontend_mobile'])
	@IsOptional()
	sourceType?: 'backend' | 'frontend_web' | 'frontend_mobile';

	@IsString()
	@IsOptional()
	@MaxLength(100)
	serviceName?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	userId?: string;

	@IsString()
	@IsOptional()
	@MaxLength(100)
	sessionId?: string;

	@IsString()
	@IsOptional()
	@MaxLength(2000)
	requestUrl?: string;

	@IsString()
	@IsOptional()
	@MaxLength(10)
	requestMethod?: string;

	@IsObject()
	@IsOptional()
	requestHeaders?: Record<string, unknown>;

	@IsObject()
	@IsOptional()
	requestBody?: Record<string, unknown>;

	@IsInt()
	@IsOptional()
	@Min(100)
	@Max(599)
	responseStatusCode?: number;

	@IsEnum(['development', 'staging', 'production'])
	@IsOptional()
	environment?: 'development' | 'staging' | 'production';

	@IsEnum(['debug', 'info', 'warning', 'error', 'critical'])
	@IsOptional()
	severity?: 'debug' | 'info' | 'warning' | 'error' | 'critical';

	@IsObject()
	@IsOptional()
	context?: Record<string, unknown>;

	@IsString()
	@IsOptional()
	@MaxLength(256)
	fingerprint?: string;

	@IsObject()
	@IsOptional()
	browserInfo?: Record<string, unknown>;

	@IsObject()
	@IsOptional()
	deviceInfo?: Record<string, unknown>;

	@IsString()
	@IsOptional()
	@MaxLength(500)
	userAgent?: string;

	@IsISO8601()
	@IsOptional()
	occurredAt?: string;
}
