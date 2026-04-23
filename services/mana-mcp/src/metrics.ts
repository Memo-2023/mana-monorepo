/**
 * Prometheus metrics — exported on GET /metrics.
 *
 * Mirrors the shape of `services/mana-ai/src/metrics.ts` so Grafana and
 * status.mana.how recognise this service without special-casing. Metric
 * names use the `mana_mcp_*` prefix; labels stay low-cardinality on
 * purpose (tool name is high-cardinality but still a fixed registry, so
 * it's acceptable — we have ~20 tools today).
 */

import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
register.setDefaultLabels({ service: 'mana-mcp' });
collectDefaultMetrics({ register, prefix: 'mana_mcp_' });

// ── Policy gate ──────────────────────────────────────────────

/**
 * One sample per `evaluatePolicy()` call.
 *
 * Labels:
 *   - `decision`: `allow` | `deny` | `flagged` (flagged = allow with a
 *      reminder, e.g. freetext injection marker hit)
 *   - `reason`:   `admin-scope-not-invokable` | `destructive-not-allowed`
 *                 | `rate-limit-exceeded` | `injection-marker`
 *                 | `clean` (no reason applied; for dashboards)
 *   - `mode`:     `log-only` | `enforce` — lets us diff how many
 *                 decisions WOULD block vs. actually blocked during soak
 */
export const policyDecisionsTotal = new Counter({
	name: 'mana_mcp_policy_decisions_total',
	help: 'Tool-policy gate decisions, bucketed by outcome and reason.',
	labelNames: ['decision', 'reason', 'mode'] as const,
	registers: [register],
});

// ── Tool invocations ─────────────────────────────────────────

/**
 * Every tool that makes it past the policy gate lands here. `outcome`
 * is `success` | `handler-error` | `input-invalid` so dashboards can
 * differentiate "tool ran but failed" from "LLM sent malformed args".
 * Policy-denied calls are NOT counted here — they never reach the
 * handler — and are visible under `policyDecisionsTotal{decision='deny'}`.
 */
export const toolInvocationsTotal = new Counter({
	name: 'mana_mcp_tool_invocations_total',
	help: 'Tool handler invocations (after policy gate).',
	labelNames: ['tool', 'outcome'] as const,
	registers: [register],
});

export const toolDuration = new Histogram({
	name: 'mana_mcp_tool_duration_seconds',
	help: 'Handler wall-clock latency per tool.',
	labelNames: ['tool', 'outcome'] as const,
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [register],
});
