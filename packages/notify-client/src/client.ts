import type {
	SendEmailOptions,
	SendPushOptions,
	SendWebhookOptions,
	ScheduleOptions,
	NotificationResponse,
	BatchNotificationResponse,
	Template,
	RenderedTemplate,
} from './types';

export interface NotifyClientOptions {
	serviceUrl: string;
	serviceKey: string;
	appId: string;
	timeout?: number;
}

export class NotifyClient {
	private readonly serviceUrl: string;
	private readonly serviceKey: string;
	private readonly appId: string;
	private readonly timeout: number;

	constructor(options: NotifyClientOptions) {
		this.serviceUrl = options.serviceUrl.replace(/\/$/, '');
		this.serviceKey = options.serviceKey;
		this.appId = options.appId;
		this.timeout = options.timeout || 30000;
	}

	// ==================== Notifications ====================

	/**
	 * Send an email notification
	 */
	async sendEmail(options: SendEmailOptions): Promise<NotificationResponse> {
		const payload: Record<string, unknown> = {
			channel: 'email',
			appId: this.appId,
			recipient: options.to,
			template: options.template,
			subject: options.subject,
			body: options.body,
			data: options.data,
			priority: options.priority,
			externalId: options.externalId,
		};

		// Only include emailOptions if from or replyTo is provided
		if (options.from || options.replyTo) {
			payload.emailOptions = {
				...(options.from && { from: options.from }),
				...(options.replyTo && { replyTo: options.replyTo }),
			};
		}

		return this.send(payload);
	}

	/**
	 * Send a push notification
	 */
	async sendPush(options: SendPushOptions): Promise<NotificationResponse> {
		return this.send({
			channel: 'push',
			appId: this.appId,
			userId: options.userId,
			recipient: options.token,
			recipients: options.tokens,
			subject: options.title,
			body: options.body,
			data: options.data,
			pushOptions: {
				sound: options.sound,
				badge: options.badge,
				channelId: options.channelId,
			},
			priority: options.priority,
			externalId: options.externalId,
		});
	}

	/**
	 * Send a webhook notification
	 */
	async sendWebhook(options: SendWebhookOptions): Promise<NotificationResponse> {
		return this.send({
			channel: 'webhook',
			appId: this.appId,
			recipient: options.url,
			data: options.body,
			webhookOptions: {
				method: options.method,
				headers: options.headers,
				timeout: options.timeout,
			},
			priority: options.priority,
			externalId: options.externalId,
		});
	}

	/**
	 * Schedule an email notification
	 */
	async scheduleEmail(options: SendEmailOptions & ScheduleOptions): Promise<NotificationResponse> {
		const payload: Record<string, unknown> = {
			channel: 'email',
			appId: this.appId,
			recipient: options.to,
			template: options.template,
			subject: options.subject,
			body: options.body,
			data: options.data,
			priority: options.priority,
			externalId: options.externalId,
			scheduledFor:
				options.scheduledFor instanceof Date
					? options.scheduledFor.toISOString()
					: options.scheduledFor,
		};

		// Only include emailOptions if from or replyTo is provided
		if (options.from || options.replyTo) {
			payload.emailOptions = {
				...(options.from && { from: options.from }),
				...(options.replyTo && { replyTo: options.replyTo }),
			};
		}

		return this.schedule(payload);
	}

	/**
	 * Schedule a push notification
	 */
	async schedulePush(options: SendPushOptions & ScheduleOptions): Promise<NotificationResponse> {
		return this.schedule({
			channel: 'push',
			appId: this.appId,
			userId: options.userId,
			recipient: options.token,
			recipients: options.tokens,
			subject: options.title,
			body: options.body,
			data: options.data,
			pushOptions: {
				sound: options.sound,
				badge: options.badge,
				channelId: options.channelId,
			},
			priority: options.priority,
			externalId: options.externalId,
			scheduledFor:
				options.scheduledFor instanceof Date
					? options.scheduledFor.toISOString()
					: options.scheduledFor,
		});
	}

	/**
	 * Send multiple notifications in batch
	 */
	async sendBatch(
		notifications: Array<
			| ({ type: 'email' } & SendEmailOptions)
			| ({ type: 'push' } & SendPushOptions)
			| ({ type: 'webhook' } & SendWebhookOptions)
		>
	): Promise<BatchNotificationResponse> {
		const mapped = notifications.map((n) => {
			if (n.type === 'email') {
				return {
					channel: 'email' as const,
					appId: this.appId,
					recipient: n.to,
					template: n.template,
					subject: n.subject,
					body: n.body,
					data: n.data,
					priority: n.priority,
					externalId: n.externalId,
				};
			} else if (n.type === 'push') {
				return {
					channel: 'push' as const,
					appId: this.appId,
					userId: n.userId,
					recipient: n.token,
					recipients: n.tokens,
					subject: n.title,
					body: n.body,
					data: n.data,
					priority: n.priority,
					externalId: n.externalId,
				};
			} else {
				return {
					channel: 'webhook' as const,
					appId: this.appId,
					recipient: n.url,
					data: n.body,
					priority: n.priority,
					externalId: n.externalId,
				};
			}
		});

		const response = await this.request<BatchNotificationResponse>('/notifications/batch', {
			method: 'POST',
			body: JSON.stringify({ notifications: mapped }),
		});

		return response;
	}

	/**
	 * Get notification status
	 */
	async getNotification(id: string): Promise<NotificationResponse | null> {
		const response = await this.request<{ notification: NotificationResponse | null }>(
			`/notifications/${id}`
		);
		return response.notification;
	}

	/**
	 * Cancel a pending notification
	 */
	async cancelNotification(id: string): Promise<NotificationResponse> {
		const response = await this.request<{ notification: NotificationResponse }>(
			`/notifications/${id}`,
			{ method: 'DELETE' }
		);
		return response.notification;
	}

	// ==================== Templates ====================

	/**
	 * List all templates
	 */
	async listTemplates(appId?: string): Promise<Template[]> {
		const url = appId ? `/templates?appId=${encodeURIComponent(appId)}` : '/templates';
		const response = await this.request<{ templates: Template[] }>(url);
		return response.templates;
	}

	/**
	 * Get a template by slug
	 */
	async getTemplate(slug: string, locale = 'de-DE'): Promise<Template | null> {
		const response = await this.request<{ template: Template | null }>(
			`/templates/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`
		);
		return response.template;
	}

	/**
	 * Preview a template with data
	 */
	async previewTemplate(
		slug: string,
		data: Record<string, unknown>,
		locale = 'de-DE'
	): Promise<RenderedTemplate | null> {
		const response = await this.request<{ preview: RenderedTemplate | null }>(
			`/templates/${encodeURIComponent(slug)}/preview?locale=${encodeURIComponent(locale)}`,
			{
				method: 'POST',
				body: JSON.stringify({ data }),
			}
		);
		return response.preview;
	}

	// ==================== Private Methods ====================

	private async send(payload: Record<string, unknown>): Promise<NotificationResponse> {
		const response = await this.request<{ notification: NotificationResponse }>(
			'/notifications/send',
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		);
		return response.notification;
	}

	private async schedule(payload: Record<string, unknown>): Promise<NotificationResponse> {
		const response = await this.request<{ notification: NotificationResponse }>(
			'/notifications/schedule',
			{
				method: 'POST',
				body: JSON.stringify(payload),
			}
		);
		return response.notification;
	}

	private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
		const url = `${this.serviceUrl}/api/v1${path}`;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeout);

		try {
			const response = await fetch(url, {
				...options,
				headers: {
					'Content-Type': 'application/json',
					'X-Service-Key': this.serviceKey,
					...options.headers,
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const message =
					(errorData as { error?: { message?: string } }).error?.message ||
					`HTTP ${response.status}`;
				throw new Error(`NotifyClient error: ${message}`);
			}

			return response.json() as Promise<T>;
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('NotifyClient error: Request timeout');
			}
			throw error;
		}
	}
}
