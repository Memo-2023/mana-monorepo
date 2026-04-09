/* eslint-disable no-undef */
/**
 * Load test for `apps/api` — the unified Hono/Bun API server that hosts
 * all 16 product compute modules (calendar, todo, chat, picture, planta,
 * nutriphi, news, traces, moodlit, presi, music, contacts, storage,
 * context, guides, research) on a single port.
 *
 * Why this script exists
 * ----------------------
 * The pre-launch consolidation collapsed 17+ per-product backends into
 * one process. That makes apps/api the single point of failure for
 * every authenticated module call the unified Mana web app makes.
 * If a single Drizzle query is missing an index, or the auth middleware
 * has a hot-path allocation, or the rate limiter contends on a shared
 * map — every module degrades together. The other load-tests in this
 * directory cover mana-auth, mana-sync, mana-llm, and the SvelteKit
 * frontends, but apps/api itself was unmeasured. This is that missing
 * piece.
 *
 * What it tests
 * -------------
 * A weighted mixed workload that exercises the full middleware stack
 * (CORS → request logger → rate limit → auth → router → handler) plus
 * a representative range of handler shapes:
 *
 *   - 25%  GET /health                            (no auth, baseline)
 *   - 20%  GET /api/v1/moodlit/presets            (auth + in-memory return)
 *   - 15%  GET /api/v1/chat/models                (auth + DB read of models)
 *   - 20%  POST /api/v1/calendar/events/expand    (auth + Zod + RRULE compute)
 *   - 12%  POST /api/v1/todo/compute/next-occurrence
 *                                                 (auth + Zod + rrule lib)
 *   -  8%  POST /api/v1/todo/compute/validate     (auth + Zod + rrule lib)
 *
 * No write endpoints are exercised — those would need cleanup and would
 * conflate write-amplification load with API-server cost. The compute
 * routes here all run in <50ms on a warm machine; what we're measuring
 * is the overhead the unified server adds on top of pure handler work.
 *
 * Authentication
 * --------------
 * apps/api requires JWT auth on every /api/* route. setup() acquires a
 * token once before the VUs start hammering and shares it for the
 * duration of the run. Three sources, in order:
 *
 *   1. $MANA_API_TOKEN  — provide a pre-minted token (CI-friendly)
 *   2. login a fresh test account at $TEST_EMAIL / $TEST_PASSWORD
 *   3. register a new account on the fly with the same credentials
 *
 * The script bails with a clear error if none of these work.
 *
 * Usage
 * -----
 *   # local
 *   k6 run load-tests/api.js
 *
 *   # against staging
 *   k6 run -e API_URL=https://api.mana.how -e AUTH_URL=https://auth.mana.how \
 *          -e MANA_API_TOKEN=eyJhbGc... \
 *          load-tests/api.js
 *
 *   # heavier
 *   k6 run --vus 200 --duration 5m load-tests/api.js
 *
 *   # JSON output for Grafana
 *   k6 run --out json=api-load.json load-tests/api.js
 */

import http from 'k6/http';
import { check, sleep, group, fail } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const authedLatency = new Trend('authed_request_duration');

const API_URL = __ENV.API_URL || 'http://localhost:3060';
const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:3001';
const TEST_EMAIL = __ENV.TEST_EMAIL || 'loadtest-api@mana.test';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'LoadTestApi123!';

export const options = {
	stages: [
		{ duration: '30s', target: 10 }, // warmup
		{ duration: '2m', target: 50 }, // sustained
		{ duration: '1m', target: 100 }, // peak
		{ duration: '30s', target: 0 }, // cooldown
	],
	thresholds: {
		// Overall — health-checks pull the average way down so the global
		// p95 should sit below 500ms.
		http_req_duration: ['p(95)<500', 'p(99)<2000'],

		// Per-route-class budgets — these are the real signal.
		'http_req_duration{kind:health}': ['p(95)<100'],
		'http_req_duration{kind:authed_get}': ['p(95)<300'],
		'http_req_duration{kind:authed_post}': ['p(95)<500'],

		// Application-level error rate (4xx + 5xx + check failures).
		errors: ['rate<0.01'],

		// Setup must succeed — if we can't even acquire a token, abort.
		'http_req_failed{kind:setup}': ['rate<0.01'],
	},
};

/**
 * Acquire a JWT for the load run. Runs once before any VU starts.
 */
export function setup() {
	const envToken = __ENV.MANA_API_TOKEN;
	if (envToken) {
		console.log('[setup] using $MANA_API_TOKEN from env');
		return { token: envToken };
	}

	// Try login first — works on subsequent runs after the first
	// register has seeded the test account.
	let res = http.post(
		`${AUTH_URL}/api/v1/auth/login`,
		JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
		{
			headers: { 'Content-Type': 'application/json' },
			tags: { kind: 'setup' },
		}
	);

	if (res.status === 200) {
		const token = res.json('accessToken');
		if (token) {
			console.log(`[setup] logged in as ${TEST_EMAIL}`);
			return { token };
		}
	}

	// Login failed — first run, register the account.
	res = http.post(
		`${AUTH_URL}/api/v1/auth/register`,
		JSON.stringify({
			email: TEST_EMAIL,
			password: TEST_PASSWORD,
			name: 'API Load Test',
		}),
		{
			headers: { 'Content-Type': 'application/json' },
			tags: { kind: 'setup' },
		}
	);

	if (res.status === 200 || res.status === 201) {
		const token = res.json('accessToken');
		if (token) {
			console.log(`[setup] registered new account ${TEST_EMAIL}`);
			return { token };
		}
	}

	fail(`could not acquire test token — login=${res.status} body=${String(res.body).slice(0, 200)}`);
}

export default function (data) {
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${data.token}`,
	};

	const roll = Math.random();

	if (roll < 0.25) {
		// 25% — Baseline. /health has no auth, no DB, no module — measures
		// pure middleware cost (CORS + request logger + 404 routing).
		group('health', () => {
			const res = http.get(`${API_URL}/health`, { tags: { kind: 'health' } });
			const ok = check(res, {
				'health 200': (r) => r.status === 200,
			});
			errorRate.add(!ok);
		});
	} else if (roll < 0.45) {
		// 20% — Authed GET, in-memory response. Tests auth middleware
		// overhead + JSON serialization on the hot path.
		group('moodlit_presets', () => {
			const res = http.get(`${API_URL}/api/v1/moodlit/presets`, {
				headers,
				tags: { kind: 'authed_get' },
			});
			authedLatency.add(res.timings.duration);
			const ok = check(res, {
				'presets 200': (r) => r.status === 200,
				'presets is array': (r) => {
					try {
						const body = r.json();
						return Array.isArray(body) && body.length > 0;
					} catch {
						return false;
					}
				},
			});
			errorRate.add(!ok);
		});
	} else if (roll < 0.6) {
		// 15% — Authed GET, DB-backed read. The chat models endpoint
		// returns the catalogue from postgres — exercises the connection
		// pool and a small SELECT.
		group('chat_models', () => {
			const res = http.get(`${API_URL}/api/v1/chat/models`, {
				headers,
				tags: { kind: 'authed_get' },
			});
			authedLatency.add(res.timings.duration);
			const ok = check(res, {
				'models 200': (r) => r.status === 200,
			});
			errorRate.add(!ok);
		});
	} else if (roll < 0.8) {
		// 20% — Authed POST, Zod validation, pure compute. The expand
		// route walks the RRULE manually and builds an array of ISO
		// timestamps; no DB, no I/O. This is what an authenticated POST
		// to apps/api should cost in the ideal case.
		group('calendar_expand', () => {
			const res = http.post(
				`${API_URL}/api/v1/calendar/events/expand`,
				JSON.stringify({
					rrule: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
					dtstart: '2026-01-01T09:00:00Z',
					until: '2026-04-01T00:00:00Z',
				}),
				{ headers, tags: { kind: 'authed_post' } }
			);
			authedLatency.add(res.timings.duration);
			const ok = check(res, {
				'expand 200': (r) => r.status === 200,
				'expand returns occurrences': (r) => {
					try {
						return Array.isArray(r.json('occurrences'));
					} catch {
						return false;
					}
				},
			});
			errorRate.add(!ok);
		});
	} else if (roll < 0.92) {
		// 12% — Same shape as expand but uses the rrule library instead
		// of the hand-rolled walker. Catches the case where the rrule
		// dependency is the bottleneck rather than our own code.
		group('todo_next_occurrence', () => {
			const res = http.post(
				`${API_URL}/api/v1/todo/compute/next-occurrence`,
				JSON.stringify({
					rrule: 'FREQ=DAILY;COUNT=30',
					after: '2026-04-09T00:00:00Z',
				}),
				{ headers, tags: { kind: 'authed_post' } }
			);
			authedLatency.add(res.timings.duration);
			const ok = check(res, {
				'next-occurrence 200': (r) => r.status === 200,
			});
			errorRate.add(!ok);
		});
	} else {
		// 8% — Tiny compute path that mostly exercises the validation
		// branch and Zod schema parsing.
		group('todo_validate_rrule', () => {
			const res = http.post(
				`${API_URL}/api/v1/todo/compute/validate`,
				JSON.stringify({ rrule: 'FREQ=MONTHLY;BYMONTHDAY=15' }),
				{ headers, tags: { kind: 'authed_post' } }
			);
			authedLatency.add(res.timings.duration);
			const ok = check(res, {
				'validate 200': (r) => r.status === 200,
			});
			errorRate.add(!ok);
		});
	}

	// Sleep 0.5–2s between iterations to keep the VU count translatable
	// to "concurrent users" rather than "max requests/sec".
	sleep(Math.random() * 1.5 + 0.5);
}
