/**
 * OpenTelemetry tracing setup for mana-ai.
 *
 * Exports a tracer and initializes the trace provider on first import.
 * Traces are exported via OTLP/HTTP to Grafana Tempo (or any
 * OTLP-compatible backend). When no backend is configured
 * (OTEL_EXPORTER_OTLP_ENDPOINT not set), tracing is a no-op.
 *
 * Usage in service code:
 *   import { tracer } from '../tracing';
 *   const span = tracer.startSpan('tick.planOneMission');
 *   try { ... } finally { span.end(); }
 *
 * Or with the helper:
 *   import { withSpan } from '../tracing';
 *   const result = await withSpan('tick.planOneMission', { missionId }, async (span) => {
 *     // ... your code
 *   });
 */

import {
	trace,
	SpanStatusCode,
	type Span,
	type Tracer,
	type SpanOptions,
} from '@opentelemetry/api';
import {
	BasicTracerProvider,
	SimpleSpanProcessor,
	BatchSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

// Initialize provider once on module load
if (OTEL_ENDPOINT) {
	const resource = new Resource({
		[ATTR_SERVICE_NAME]: 'mana-ai',
		[ATTR_SERVICE_VERSION]: '0.6.0',
	});

	const exporter = new OTLPTraceExporter({
		url: `${OTEL_ENDPOINT}/v1/traces`,
	});

	const provider = new BasicTracerProvider({ resource });
	// Use batch in production (less overhead), simple in dev (immediate export)
	const isDev = process.env.NODE_ENV === 'development';
	provider.addSpanProcessor(
		isDev ? new SimpleSpanProcessor(exporter) : new BatchSpanProcessor(exporter)
	);
	provider.register();

	console.log(`[mana-ai] OTel tracing enabled → ${OTEL_ENDPOINT}/v1/traces`);
} else {
	console.log('[mana-ai] OTel tracing disabled (set OTEL_EXPORTER_OTLP_ENDPOINT to enable)');
}

/** The mana-ai tracer instance. When OTel is not configured, all
 *  operations are no-ops (the API guarantees this). */
export const tracer: Tracer = trace.getTracer('mana-ai', '0.6.0');

/**
 * Execute an async function within a traced span. Automatically:
 * - Sets span attributes from the provided record
 * - Marks the span as ERROR on throw
 * - Ends the span in all cases
 */
export async function withSpan<T>(
	name: string,
	attributes: Record<string, string | number | boolean>,
	fn: (span: Span) => Promise<T>,
	options?: SpanOptions
): Promise<T> {
	return tracer.startActiveSpan(name, options ?? {}, async (span) => {
		for (const [key, value] of Object.entries(attributes)) {
			span.setAttribute(key, value);
		}
		try {
			const result = await fn(span);
			return result;
		} catch (err) {
			span.setStatus({
				code: SpanStatusCode.ERROR,
				message: err instanceof Error ? err.message : String(err),
			});
			throw err;
		} finally {
			span.end();
		}
	});
}
