/**
 * mana-research — Web Research Provider Orchestration
 *
 * Bundles search/extract/agent providers behind a unified interface.
 * Phase 1: 4 search providers (SearXNG, DuckDuckGo, Brave, Tavily) with
 * credits + cache + eval-run persistence.
 *
 * Port: 3068. See docs/plans/mana-research-service.md.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { loadConfig } from './config';
import { getDb } from './db/connection';
import { serviceErrorHandler } from '@mana/shared-hono';
import { jwtAuth } from './middleware/jwt-auth';
import { serviceAuth } from './middleware/service-auth';
import { healthRoutes } from './routes/health';
import { createSearchRoutes } from './routes/search';
import { createExtractRoutes } from './routes/extract';
import { createResearchRoutes } from './routes/research';
import { createInternalResearchRoutes } from './routes/internal-research';
import { createProvidersRoutes } from './routes/providers';
import { createRunsRoutes } from './routes/runs';
import { createProviderConfigRoutes } from './routes/provider-configs';
import { buildRegistry } from './providers/registry';
import { RunStorage } from './storage/runs';
import { ConfigStorage } from './storage/configs';
import { AsyncJobStorage } from './storage/async-jobs';
import { CreditsClient } from './clients/mana-credits';
import { ManaSearchClient } from './clients/mana-search';
import { ManaLlmClient } from './clients/mana-llm';
import { initCache } from './lib/cache';

// ─── Bootstrap ──────────────────────────────────────────────

const config = loadConfig();
const db = getDb(config.databaseUrl);

initCache(config.redisUrl);

const manaSearch = new ManaSearchClient(config.manaSearchUrl);
const manaLlm = new ManaLlmClient(config.manaLlmUrl);
const credits = new CreditsClient({
	baseUrl: config.manaCreditsUrl,
	serviceKey: config.serviceKey,
});

const runStorage = new RunStorage(db);
const configStorage = new ConfigStorage(db);
const asyncStorage = new AsyncJobStorage(db);
const registry = buildRegistry({ manaSearch });

const executorDeps = {
	credits,
	configs: configStorage,
	config,
};

// ─── App ────────────────────────────────────────────────────

const app = new Hono();

app.onError(serviceErrorHandler);
app.use(
	'*',
	cors({
		origin: config.cors.origins,
		credentials: true,
	})
);

// Health (no auth)
app.route('/health', healthRoutes);

// Metrics stub (no auth) — will be populated in Phase 2 with prometheus-style output
app.get('/metrics', (c) => c.text('# mana-research metrics stub\n'));

// Providers catalog (no auth — callers often query this to build UIs)
app.route('/api/v1/providers', createProvidersRoutes(registry, config));

// User-facing research (JWT auth)
app.use('/api/v1/search/*', jwtAuth(config.manaAuthUrl));
app.route(
	'/api/v1/search',
	createSearchRoutes(registry, runStorage, executorDeps, config, manaLlm)
);

app.use('/api/v1/extract/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/extract', createExtractRoutes(registry, runStorage, executorDeps, config));

app.use('/api/v1/research/*', jwtAuth(config.manaAuthUrl));
app.route(
	'/api/v1/research',
	createResearchRoutes(registry, runStorage, executorDeps, config, asyncStorage, credits)
);

app.use('/api/v1/runs/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/runs', createRunsRoutes(runStorage));

app.use('/api/v1/provider-configs/*', jwtAuth(config.manaAuthUrl));
app.route('/api/v1/provider-configs', createProviderConfigRoutes(db));

// Service-to-service (X-Service-Key auth). Callers pass the target user
// in X-User-Id so credit accounting still lands on the right wallet.
app.use('/api/v1/internal/*', serviceAuth(config.serviceKey));
app.get('/api/v1/internal/health', (c) => c.json({ ok: true }));
app.route('/api/v1/internal/research', createInternalResearchRoutes(config, asyncStorage, credits));

// ─── Start ──────────────────────────────────────────────────

console.log(`mana-research starting on port ${config.port}...`);

export default {
	port: config.port,
	fetch: app.fetch,
};
