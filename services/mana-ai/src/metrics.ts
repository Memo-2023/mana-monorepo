/**
 * Prometheus metrics — exported on GET /metrics.
 *
 * Follows the same shape as mana-media (default metrics with a service
 * prefix, plus a handful of service-specific counters + histograms) so
 * the existing Grafana dashboards and the status.mana.how generator
 * recognise this service without special-casing.
 *
 * Metric naming: `mana_ai_*`. Underscore separator keeps Prometheus's
 * standard-compliant regex `[a-zA-Z_:][a-zA-Z0-9_:]*` happy.
 */

import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();
register.setDefaultLabels({ service: 'mana-ai' });
collectDefaultMetrics({ register, prefix: 'mana_ai_' });

// ── HTTP surface ──────────────────────────────────────────

export const httpRequestsTotal = new Counter({
	name: 'mana_ai_http_requests_total',
	help: 'Total HTTP requests received.',
	labelNames: ['method', 'path', 'status'] as const,
	registers: [register],
});

export const httpRequestDuration = new Histogram({
	name: 'mana_ai_http_request_duration_seconds',
	help: 'Latency per HTTP request.',
	labelNames: ['method', 'path', 'status'] as const,
	buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
	registers: [register],
});

// ── Mission runner — service-specific ─────────────────────

export const ticksTotal = new Counter({
	name: 'mana_ai_ticks_total',
	help: 'Total tick loop runs (all completions, including empty ones).',
	registers: [register],
});

export const tickDuration = new Histogram({
	name: 'mana_ai_tick_duration_seconds',
	help: 'Wall-clock time spent inside one tick pass.',
	buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
	registers: [register],
});

export const plansProducedTotal = new Counter({
	name: 'mana_ai_plans_produced_total',
	help: 'Total plans the Planner returned parseable output for.',
	registers: [register],
});

export const plansWrittenBackTotal = new Counter({
	name: 'mana_ai_plans_written_back_total',
	help: 'Total plans persisted as server iterations on aiMissions.',
	registers: [register],
});

export const parseFailuresTotal = new Counter({
	name: 'mana_ai_parse_failures_total',
	help: 'Planner responses that failed JSON / shape validation.',
	registers: [register],
});

export const missionErrorsTotal = new Counter({
	name: 'mana_ai_mission_errors_total',
	help: 'Errors thrown while processing a single mission within a tick.',
	registers: [register],
});

export const plannerLatency = new Histogram({
	name: 'mana_ai_planner_request_duration_seconds',
	help: 'Latency of calls to the mana-llm backend.',
	buckets: [0.25, 0.5, 1, 2, 5, 10, 30, 60],
	registers: [register],
});

// ── Snapshot refresh ──────────────────────────────────────

export const snapshotsNewTotal = new Counter({
	name: 'mana_ai_snapshots_new_total',
	help: 'Mission-snapshot rows created on first sighting.',
	registers: [register],
});

export const snapshotsUpdatedTotal = new Counter({
	name: 'mana_ai_snapshots_updated_total',
	help: 'Mission-snapshot rows updated with a delta.',
	registers: [register],
});

export const snapshotRowsAppliedTotal = new Counter({
	name: 'mana_ai_snapshot_rows_applied_total',
	help: 'Sync-changes rows folded into the snapshot cache.',
	registers: [register],
});
