/**
 * Request-level metrics for LLM calls.
 *
 * Provides an optional callback system that backends can hook into
 * for monitoring, logging, or forwarding to Prometheus/Grafana.
 */

export interface LlmRequestMetrics {
	/** Model requested (e.g. "ollama/gemma3:4b") */
	model: string;
	/** Model actually used (may differ if fallback occurred) */
	actualModel: string;
	/** Request type */
	type: 'chat' | 'json' | 'vision' | 'visionJson' | 'embed' | 'stream';
	/** Total request duration in ms */
	latencyMs: number;
	/** Token usage */
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
	/** Whether this request was a fallback (model differs from requested) */
	wasFallback: boolean;
	/** Whether the request succeeded */
	success: boolean;
	/** Error message if failed */
	error?: string;
}

export type MetricsCallback = (metrics: LlmRequestMetrics) => void;

/**
 * Simple in-memory metrics aggregator.
 * Useful for health endpoints and debugging.
 */
export class LlmMetricsCollector {
	private _totalRequests = 0;
	private _totalErrors = 0;
	private _totalFallbacks = 0;
	private _totalTokens = 0;
	private _totalLatencyMs = 0;
	private _byModel: Map<string, { requests: number; tokens: number; errors: number }> = new Map();

	/** Use as MetricsCallback */
	readonly collect = (metrics: LlmRequestMetrics): void => {
		this._totalRequests++;
		this._totalLatencyMs += metrics.latencyMs;
		this._totalTokens += metrics.totalTokens;

		if (!metrics.success) this._totalErrors++;
		if (metrics.wasFallback) this._totalFallbacks++;

		const modelKey = metrics.actualModel;
		const existing = this._byModel.get(modelKey) ?? { requests: 0, tokens: 0, errors: 0 };
		existing.requests++;
		existing.tokens += metrics.totalTokens;
		if (!metrics.success) existing.errors++;
		this._byModel.set(modelKey, existing);
	};

	/** Get summary stats for health endpoints / dashboards */
	getSummary() {
		return {
			totalRequests: this._totalRequests,
			totalErrors: this._totalErrors,
			totalFallbacks: this._totalFallbacks,
			totalTokens: this._totalTokens,
			averageLatencyMs:
				this._totalRequests > 0 ? Math.round(this._totalLatencyMs / this._totalRequests) : 0,
			fallbackRate:
				this._totalRequests > 0
					? Math.round((this._totalFallbacks / this._totalRequests) * 100)
					: 0,
			errorRate:
				this._totalRequests > 0 ? Math.round((this._totalErrors / this._totalRequests) * 100) : 0,
			byModel: Object.fromEntries(this._byModel),
		};
	}

	/** Reset all counters */
	reset(): void {
		this._totalRequests = 0;
		this._totalErrors = 0;
		this._totalFallbacks = 0;
		this._totalTokens = 0;
		this._totalLatencyMs = 0;
		this._byModel.clear();
	}
}
