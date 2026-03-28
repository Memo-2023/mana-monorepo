/* eslint-disable no-undef */
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const signupBlocked = new Counter('signup_blocked');

const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:3001';

export const options = {
	stages: [
		{ duration: '30s', target: 5 },
		{ duration: '2m', target: 20 },
		{ duration: '30s', target: 0 },
	],
	thresholds: {
		http_req_duration: ['p(95)<3000'],
		errors: ['rate<0.10'],
	},
};

// Generate unique test emails
function testEmail(vuId, iter) {
	return `loadtest_vu${vuId}_${iter}_${Date.now()}@test.invalid`;
}

export default function () {
	// Weighted random: 70% health, 20% login attempts, 10% register
	const roll = Math.random();

	if (roll < 0.7) {
		// Health check — lightweight, tests baseline
		group('health', () => {
			const res = http.get(`${AUTH_URL}/health`);
			const ok = check(res, {
				'health 200': (r) => r.status === 200,
			});
			errorRate.add(!ok);
		});
	} else if (roll < 0.9) {
		// Login attempt with invalid credentials — tests lockout + DB
		group('login', () => {
			const res = http.post(
				`${AUTH_URL}/api/v1/auth/login`,
				JSON.stringify({
					email: 'loadtest@nonexistent.invalid',
					password: 'wrongpassword',
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
			const ok = check(res, {
				'login returns 401 or 429': (r) => r.status === 401 || r.status === 429,
			});
			errorRate.add(!ok);
		});
	} else {
		// Registration — tests signup limit
		group('register', () => {
			const email = testEmail(__VU, __ITER);
			const res = http.post(
				`${AUTH_URL}/api/v1/auth/register`,
				JSON.stringify({
					email: email,
					password: 'TestPassword123!',
					name: `Load Test ${__VU}`,
				}),
				{ headers: { 'Content-Type': 'application/json' } }
			);
			const ok = check(res, {
				'register returns 200 or 429': (r) => r.status === 200 || r.status === 429,
			});
			if (res.status === 429) {
				signupBlocked.add(1);
			}
			errorRate.add(!ok);
		});
	}

	sleep(Math.random() * 1.5 + 0.5);
}
