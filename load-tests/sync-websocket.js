/* eslint-disable no-undef, no-console, @typescript-eslint/no-unused-vars */
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { Rate, Counter, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const messagesReceived = new Counter('ws_messages_received');
const messagesSent = new Counter('ws_messages_sent');
const connectTime = new Trend('ws_connect_time', true);

const SYNC_URL = __ENV.SYNC_URL || 'ws://localhost:3050';

export const options = {
	stages: [
		{ duration: '30s', target: 10 },
		{ duration: '3m', target: 30 },
		{ duration: '30s', target: 0 },
	],
	thresholds: {
		errors: ['rate<0.10'],
		ws_connect_time: ['p(95)<1000'],
	},
};

export default function () {
	const url = `${SYNC_URL}/ws`;

	const startTime = Date.now();
	const res = ws.connect(url, {}, function (socket) {
		const connected = Date.now() - startTime;
		connectTime.add(connected);

		socket.on('open', () => {
			// Send a sync handshake (collection subscription)
			const handshake = JSON.stringify({
				type: 'subscribe',
				collections: ['tasks', 'events', 'contacts'],
				userId: `loadtest-vu-${__VU}`,
				lastSyncTimestamp: new Date(Date.now() - 60000).toISOString(),
			});
			socket.send(handshake);
			messagesSent.add(1);
		});

		socket.on('message', (data) => {
			messagesReceived.add(1);

			// Parse and validate sync messages
			try {
				const msg = JSON.parse(data);
				check(msg, {
					'has type field': (m) => m.type !== undefined,
				});
			} catch (_) {
				// Binary or non-JSON message
			}
		});

		socket.on('error', (e) => {
			errorRate.add(true);
			console.error(`WS error VU ${__VU}: ${e.error()}`);
		});

		// Keep connection alive for 10-30 seconds (simulates real user session)
		const sessionDuration = Math.random() * 20 + 10;

		// Send periodic sync pings
		const pingInterval = setInterval(() => {
			socket.send(JSON.stringify({ type: 'ping' }));
			messagesSent.add(1);
		}, 5000);

		sleep(sessionDuration);
		clearInterval(pingInterval);
		socket.close();
	});

	const ok = check(res, {
		'WS connection status is 101': (r) => r && r.status === 101,
	});
	errorRate.add(!ok);

	sleep(Math.random() * 2 + 1);
}
