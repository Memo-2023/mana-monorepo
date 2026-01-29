import { Injectable, OnModuleInit } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
	private readonly registry: Registry;

	// Notification counters
	private readonly notificationsSent: Counter;
	private readonly notificationsFailed: Counter;

	// Channel-specific counters
	private readonly emailsSent: Counter;
	private readonly pushNotificationsSent: Counter;
	private readonly matrixMessagesSent: Counter;
	private readonly webhooksSent: Counter;

	// Latency histograms
	private readonly notificationLatency: Histogram;
	private readonly emailLatency: Histogram;
	private readonly pushLatency: Histogram;

	constructor() {
		this.registry = new Registry();

		// Total notifications
		this.notificationsSent = new Counter({
			name: 'mana_notify_notifications_sent_total',
			help: 'Total number of notifications sent successfully',
			labelNames: ['channel', 'app_id'],
			registers: [this.registry],
		});

		this.notificationsFailed = new Counter({
			name: 'mana_notify_notifications_failed_total',
			help: 'Total number of notifications that failed to send',
			labelNames: ['channel', 'app_id', 'error_type'],
			registers: [this.registry],
		});

		// Channel-specific
		this.emailsSent = new Counter({
			name: 'mana_notify_emails_sent_total',
			help: 'Total number of emails sent',
			labelNames: ['template', 'status'],
			registers: [this.registry],
		});

		this.pushNotificationsSent = new Counter({
			name: 'mana_notify_push_sent_total',
			help: 'Total number of push notifications sent',
			labelNames: ['platform', 'status'],
			registers: [this.registry],
		});

		this.matrixMessagesSent = new Counter({
			name: 'mana_notify_matrix_sent_total',
			help: 'Total number of Matrix messages sent',
			labelNames: ['status'],
			registers: [this.registry],
		});

		this.webhooksSent = new Counter({
			name: 'mana_notify_webhooks_sent_total',
			help: 'Total number of webhooks sent',
			labelNames: ['status'],
			registers: [this.registry],
		});

		// Latency
		this.notificationLatency = new Histogram({
			name: 'mana_notify_notification_latency_seconds',
			help: 'Notification processing latency in seconds',
			labelNames: ['channel'],
			buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
			registers: [this.registry],
		});

		this.emailLatency = new Histogram({
			name: 'mana_notify_email_latency_seconds',
			help: 'Email sending latency in seconds',
			buckets: [0.1, 0.5, 1, 2, 5, 10],
			registers: [this.registry],
		});

		this.pushLatency = new Histogram({
			name: 'mana_notify_push_latency_seconds',
			help: 'Push notification sending latency in seconds',
			buckets: [0.01, 0.05, 0.1, 0.5, 1],
			registers: [this.registry],
		});
	}

	onModuleInit() {
		collectDefaultMetrics({ register: this.registry });
	}

	// Recording methods
	recordNotificationSent(channel: string, appId: string) {
		this.notificationsSent.inc({ channel, app_id: appId });
	}

	recordNotificationFailed(channel: string, appId: string, errorType: string) {
		this.notificationsFailed.inc({ channel, app_id: appId, error_type: errorType });
	}

	recordEmailSent(template: string, success: boolean) {
		this.emailsSent.inc({ template, status: success ? 'success' : 'failure' });
	}

	recordPushSent(platform: string, success: boolean) {
		this.pushNotificationsSent.inc({ platform, status: success ? 'success' : 'failure' });
	}

	recordMatrixSent(success: boolean) {
		this.matrixMessagesSent.inc({ status: success ? 'success' : 'failure' });
	}

	recordWebhookSent(success: boolean) {
		this.webhooksSent.inc({ status: success ? 'success' : 'failure' });
	}

	recordNotificationLatency(channel: string, durationSeconds: number) {
		this.notificationLatency.observe({ channel }, durationSeconds);
	}

	recordEmailLatency(durationSeconds: number) {
		this.emailLatency.observe(durationSeconds);
	}

	recordPushLatency(durationSeconds: number) {
		this.pushLatency.observe(durationSeconds);
	}

	async getMetrics(): Promise<string> {
		return this.registry.metrics();
	}
}
