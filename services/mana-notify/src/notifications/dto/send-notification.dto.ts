import {
	IsString,
	IsOptional,
	IsEnum,
	IsObject,
	IsArray,
	IsDateString,
	ValidateNested,
	IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationChannel {
	EMAIL = 'email',
	PUSH = 'push',
	MATRIX = 'matrix',
	WEBHOOK = 'webhook',
}

export enum NotificationPriority {
	LOW = 'low',
	NORMAL = 'normal',
	HIGH = 'high',
	CRITICAL = 'critical',
}

export class EmailData {
	@IsString()
	from?: string;

	@IsString()
	@IsOptional()
	replyTo?: string;
}

export class PushData {
	@IsString()
	@IsOptional()
	sound?: 'default' | null;

	@IsOptional()
	badge?: number;

	@IsString()
	@IsOptional()
	channelId?: string;
}

export class WebhookData {
	@IsString()
	@IsOptional()
	method?: 'POST' | 'PUT';

	@IsObject()
	@IsOptional()
	headers?: Record<string, string>;

	@IsOptional()
	timeout?: number;
}

export class MatrixData {
	@IsString()
	@IsOptional()
	msgtype?: 'text' | 'notice';

	@IsString()
	@IsOptional()
	formattedBody?: string;
}

export class SendNotificationDto {
	@IsEnum(NotificationChannel)
	channel!: NotificationChannel;

	@IsString()
	appId!: string;

	@IsString()
	@IsOptional()
	userId?: string;

	@IsString()
	@IsOptional()
	recipient?: string; // Email address, push token, room ID, or webhook URL

	@IsArray()
	@IsString({ each: true })
	@IsOptional()
	recipients?: string[]; // For batch sending to multiple recipients

	@IsString()
	@IsOptional()
	template?: string; // Template slug

	@IsString()
	@IsOptional()
	subject?: string; // Override template subject

	@IsString()
	@IsOptional()
	body?: string; // Override template body or custom content

	@IsObject()
	@IsOptional()
	data?: Record<string, unknown>; // Template variables or push data payload

	@IsEnum(NotificationPriority)
	@IsOptional()
	priority?: NotificationPriority;

	@IsString()
	@IsOptional()
	externalId?: string; // For idempotency

	// Channel-specific options
	@ValidateNested()
	@Type(() => EmailData)
	@IsOptional()
	emailOptions?: EmailData;

	@ValidateNested()
	@Type(() => PushData)
	@IsOptional()
	pushOptions?: PushData;

	@ValidateNested()
	@Type(() => WebhookData)
	@IsOptional()
	webhookOptions?: WebhookData;

	@ValidateNested()
	@Type(() => MatrixData)
	@IsOptional()
	matrixOptions?: MatrixData;
}

export class ScheduleNotificationDto extends SendNotificationDto {
	@IsDateString()
	scheduledFor!: string;
}

export class BatchNotificationDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SendNotificationDto)
	notifications!: SendNotificationDto[];
}

export class NotificationResponse {
	id!: string;
	status!: string;
	channel!: string;
	createdAt!: Date;
}

export class BatchNotificationResponse {
	results!: NotificationResponse[];
	succeeded!: number;
	failed!: number;
}
