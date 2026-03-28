/**
 * k6 Load Test for mana-sync
 *
 * Tests HTTP sync endpoints and WebSocket connections under load.
 *
 * Prerequisites:
 *   - mana-sync running (default: http://localhost:3050)
 *   - mana-auth running for JWT tokens
 *   - PostgreSQL with sync schema
 *
 * Usage:
 *   # Install k6: brew install grafana/tap/k6
 *
 *   # Quick smoke test (10 VUs, 30s)
 *   k6 run --env SYNC_URL=http://localhost:3050 --env AUTH_TOKEN=<jwt> test/load/sync-load.js
 *
 *   # Medium load (100 VUs, 2min)
 *   k6 run --env SYNC_URL=http://localhost:3050 --env AUTH_TOKEN=<jwt> \
 *     --vus 100 --duration 2m test/load/sync-load.js
 *
 *   # Stress test (500 VUs, 5min)
 *   k6 run --env SYNC_URL=http://localhost:3050 --env AUTH_TOKEN=<jwt> \
 *     --vus 500 --duration 5m test/load/sync-load.js
 *
 *   # Use specific scenario
 *   k6 run --env SCENARIO=websocket test/load/sync-load.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
const syncPushDuration = new Trend('sync_push_duration', true);
const syncPullDuration = new Trend('sync_pull_duration', true);
const wsConnectDuration = new Trend('ws_connect_duration', true);
const syncConflicts = new Counter('sync_conflicts');
const syncErrors = new Rate('sync_errors');

// Config
const SYNC_URL = __ENV.SYNC_URL || 'http://localhost:3050';
const WS_URL = SYNC_URL.replace('http', 'ws');
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const SCENARIO = __ENV.SCENARIO || 'mixed';

const APP_IDS = ['todo', 'contacts', 'calendar', 'chat', 'manadeck'];
const TABLES = {
	todo: ['tasks', 'projects', 'labels'],
	contacts: ['contacts'],
	calendar: ['calendars', 'events'],
	chat: ['conversations', 'messages'],
	manadeck: ['decks', 'cards'],
};

// Scenarios
export const options = {
	scenarios: {
		// Default: mixed workload
		mixed: {
			executor: 'ramping-vus',
			startVUs: 0,
			stages: [
				{ duration: '30s', target: 50 },
				{ duration: '1m', target: 100 },
				{ duration: '30s', target: 200 },
				{ duration: '1m', target: 200 },
				{ duration: '30s', target: 0 },
			],
			exec: 'mixedWorkload',
		},
	},
	thresholds: {
		http_req_duration: ['p(95)<500', 'p(99)<1000'],
		sync_push_duration: ['p(95)<300'],
		sync_pull_duration: ['p(95)<200'],
		sync_errors: ['rate<0.01'],
	},
};

// Override scenario from env
if (SCENARIO === 'websocket') {
	options.scenarios = {
		websocket: {
			executor: 'ramping-vus',
			startVUs: 0,
			stages: [
				{ duration: '30s', target: 100 },
				{ duration: '2m', target: 500 },
				{ duration: '1m', target: 1000 },
				{ duration: '1m', target: 1000 },
				{ duration: '30s', target: 0 },
			],
			exec: 'websocketStress',
		},
	};
} else if (SCENARIO === 'sync') {
	options.scenarios = {
		sync: {
			executor: 'constant-arrival-rate',
			rate: 200,
			timeUnit: '1s',
			duration: '3m',
			preAllocatedVUs: 50,
			maxVUs: 500,
			exec: 'syncEndpoints',
		},
	};
}

// Helpers
function randomItem(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0;
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
	});
}

function makeChanges(appId, count) {
	const tables = TABLES[appId] || ['items'];
	const changes = [];
	for (let i = 0; i < count; i++) {
		const table = randomItem(tables);
		const op = Math.random() > 0.3 ? 'update' : Math.random() > 0.5 ? 'insert' : 'delete';
		const change = {
			table,
			id: randomUUID(),
			op,
		};
		if (op === 'insert') {
			change.data = {
				title: `Load test item ${i}`,
				createdAt: new Date().toISOString(),
			};
		} else if (op === 'update') {
			change.fields = {
				title: {
					value: `Updated item ${i}`,
					updatedAt: new Date().toISOString(),
				},
			};
		} else {
			change.deletedAt = new Date().toISOString();
		}
		changes.push(change);
	}
	return changes;
}

const headers = {
	'Content-Type': 'application/json',
	Authorization: `Bearer ${AUTH_TOKEN}`,
};

// === Test Functions ===

// Push sync changes
export function syncEndpoints() {
	const appId = randomItem(APP_IDS);
	const clientId = `k6-${__VU}-${__ITER}`;

	// Push changes
	const pushPayload = JSON.stringify({
		clientId,
		since: new Date(Date.now() - 60000).toISOString(),
		changes: makeChanges(appId, Math.floor(Math.random() * 10) + 1),
	});

	const pushStart = Date.now();
	const pushRes = http.post(`${SYNC_URL}/sync/${appId}`, pushPayload, { headers });
	syncPushDuration.add(Date.now() - pushStart);

	const pushOk = check(pushRes, {
		'push status 200': (r) => r.status === 200,
		'push has syncedUntil': (r) => {
			try {
				return JSON.parse(r.body).syncedUntil !== undefined;
			} catch {
				return false;
			}
		},
	});
	if (!pushOk) syncErrors.add(1);
	else syncErrors.add(0);

	// Check for conflicts
	try {
		const body = JSON.parse(pushRes.body);
		if (body.conflicts && body.conflicts.length > 0) {
			syncConflicts.add(body.conflicts.length);
		}
	} catch {}

	sleep(0.1);

	// Pull changes
	const table = randomItem(TABLES[appId] || ['items']);
	const since = new Date(Date.now() - 300000).toISOString();

	const pullStart = Date.now();
	const pullRes = http.get(`${SYNC_URL}/sync/${appId}/pull?collection=${table}&since=${since}`, {
		headers: {
			Authorization: `Bearer ${AUTH_TOKEN}`,
			'X-Client-Id': clientId,
		},
	});
	syncPullDuration.add(Date.now() - pullStart);

	check(pullRes, {
		'pull status 200': (r) => r.status === 200,
	});

	sleep(0.1);
}

// WebSocket stress test
export function websocketStress() {
	const appId = randomItem(APP_IDS);
	const url = `${WS_URL}/ws/${appId}`;

	const connectStart = Date.now();

	const res = ws.connect(url, {}, function (socket) {
		wsConnectDuration.add(Date.now() - connectStart);

		// Authenticate
		socket.send(JSON.stringify({ type: 'auth', token: AUTH_TOKEN }));

		socket.on('message', (msg) => {
			try {
				const data = JSON.parse(msg);
				if (data.type === 'auth-ok') {
					check(data, { 'ws auth ok': (d) => d.type === 'auth-ok' });
				}
			} catch {}
		});

		// Send pings periodically
		socket.setInterval(() => {
			socket.send(JSON.stringify({ type: 'ping' }));
		}, 5000);

		// Keep connection open for 30-60s
		const holdTime = 30 + Math.random() * 30;
		socket.setTimeout(() => {
			socket.close();
		}, holdTime * 1000);
	});

	check(res, { 'ws status 101': (r) => r && r.status === 101 });
}

// Mixed workload (default)
export function mixedWorkload() {
	const roll = Math.random();
	if (roll < 0.6) {
		// 60% sync operations
		syncEndpoints();
	} else if (roll < 0.85) {
		// 25% pull only
		const appId = randomItem(APP_IDS);
		const table = randomItem(TABLES[appId] || ['items']);
		const since = new Date(Date.now() - 600000).toISOString();
		const clientId = `k6-pull-${__VU}`;

		const res = http.get(`${SYNC_URL}/sync/${appId}/pull?collection=${table}&since=${since}`, {
			headers: {
				Authorization: `Bearer ${AUTH_TOKEN}`,
				'X-Client-Id': clientId,
			},
		});
		check(res, { 'pull ok': (r) => r.status === 200 });
		sleep(0.2);
	} else {
		// 15% health check
		const res = http.get(`${SYNC_URL}/health`);
		check(res, { 'health ok': (r) => r.status === 200 });
		sleep(0.5);
	}
}

// Verify health before starting
export function setup() {
	const res = http.get(`${SYNC_URL}/health`);
	check(res, { 'sync server healthy': (r) => r.status === 200 });

	if (!AUTH_TOKEN) {
		console.warn(
			'⚠️  No AUTH_TOKEN provided. Auth-protected endpoints will fail.\n' +
				'   Set via: --env AUTH_TOKEN=$(curl -s ... | jq -r .token)'
		);
	}

	return { startTime: new Date().toISOString() };
}

export function teardown(data) {
	console.log(`Load test completed. Started at: ${data.startTime}`);
}
