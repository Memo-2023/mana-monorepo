export type NotificationChannel = 'email' | 'push' | 'matrix' | 'webhook';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationStatus = 'pending' | 'processing' | 'delivered' | 'failed' | 'cancelled';

export interface SendEmailOptions {
	to: string;
	template?: string;
	subject?: string;
	body?: string;
	data?: Record<string, unknown>;
	from?: string;
	replyTo?: string;
	priority?: NotificationPriority;
	externalId?: string;
}

export interface SendPushOptions {
	userId?: string;
	token?: string;
	tokens?: string[];
	title: string;
	body: string;
	data?: Record<string, unknown>;
	sound?: 'default' | null;
	badge?: number;
	channelId?: string;
	priority?: NotificationPriority;
	externalId?: string;
}

export interface SendMatrixOptions {
	roomId: string;
	body: string;
	formattedBody?: string;
	msgtype?: 'text' | 'notice';
	priority?: NotificationPriority;
	externalId?: string;
}

export interface SendWebhookOptions {
	url: string;
	method?: 'POST' | 'PUT';
	headers?: Record<string, string>;
	body: Record<string, unknown>;
	timeout?: number;
	priority?: NotificationPriority;
	externalId?: string;
}

export interface ScheduleOptions {
	scheduledFor: Date | string;
}

export interface NotificationResponse {
	id: string;
	status: NotificationStatus;
	channel: NotificationChannel;
	createdAt: Date;
}

export interface BatchNotificationResponse {
	results: NotificationResponse[];
	succeeded: number;
	failed: number;
}

export interface Template {
	id: string;
	slug: string;
	channel: NotificationChannel;
	subject?: string;
	bodyTemplate: string;
	locale: string;
	isActive: boolean;
	isSystem: boolean;
	variables?: Record<string, string>;
}

export interface RenderedTemplate {
	subject: string;
	body: string;
}

export interface Device {
	id: string;
	userId: string;
	pushToken: string;
	tokenType: string;
	platform: string;
	deviceName?: string;
	isActive: boolean;
}

export interface Preferences {
	id: string;
	userId: string;
	emailEnabled: boolean;
	pushEnabled: boolean;
	quietHoursEnabled: boolean;
	quietHoursStart?: string;
	quietHoursEnd?: string;
	timezone: string;
	categoryPreferences?: Record<string, Record<string, boolean>>;
}
