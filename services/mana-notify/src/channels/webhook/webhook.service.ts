import { Injectable, Logger } from '@nestjs/common';

export interface WebhookPayload {
	url: string;
	method?: 'POST' | 'PUT';
	headers?: Record<string, string>;
	body: Record<string, unknown>;
	timeout?: number;
}

export interface WebhookResult {
	success: boolean;
	statusCode?: number;
	response?: unknown;
	error?: string;
	durationMs?: number;
}

@Injectable()
export class WebhookService {
	private readonly logger = new Logger(WebhookService.name);
	private readonly defaultTimeout = 10000; // 10 seconds

	async send(payload: WebhookPayload): Promise<WebhookResult> {
		const { url, method = 'POST', headers = {}, body, timeout = this.defaultTimeout } = payload;

		const startTime = Date.now();

		this.logger.debug(`Sending webhook to ${url}`);

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'ManaNotify/1.0',
					...headers,
				},
				body: JSON.stringify(body),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			const durationMs = Date.now() - startTime;

			let responseData: unknown;
			try {
				responseData = await response.json();
			} catch {
				responseData = await response.text();
			}

			if (!response.ok) {
				this.logger.warn(`Webhook returned ${response.status}: ${url}`);
				return {
					success: false,
					statusCode: response.status,
					response: responseData,
					error: `HTTP ${response.status}`,
					durationMs,
				};
			}

			this.logger.debug(`Webhook sent successfully to ${url} in ${durationMs}ms`);
			return {
				success: true,
				statusCode: response.status,
				response: responseData,
				durationMs,
			};
		} catch (error) {
			const durationMs = Date.now() - startTime;
			const errorMessage =
				error instanceof Error
					? error.name === 'AbortError'
						? 'Request timeout'
						: error.message
					: 'Unknown error';

			this.logger.error(`Webhook failed: ${errorMessage}`);
			return {
				success: false,
				error: errorMessage,
				durationMs,
			};
		}
	}
}
