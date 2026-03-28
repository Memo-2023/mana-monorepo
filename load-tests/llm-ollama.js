/* eslint-disable no-undef, @typescript-eslint/no-unused-vars */
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const tokensPerSec = new Trend('tokens_per_second', true);
const totalTokens = new Counter('total_tokens_generated');

const OLLAMA_URL = __ENV.OLLAMA_URL || 'http://localhost:11434';
const MODEL = __ENV.MODEL || 'gemma3:4b';

export const options = {
	// LLM is single-threaded effectively — test with few VUs
	stages: [
		{ duration: '30s', target: 1 },
		{ duration: '2m', target: 3 },
		{ duration: '30s', target: 1 },
	],
	thresholds: {
		http_req_duration: ['p(95)<30000'], // LLM responses can be slow
		errors: ['rate<0.10'],
	},
};

const prompts = [
	'Was ist die Hauptstadt von Deutschland? Antworte in einem Satz.',
	'Erklaere Photosynthese in 2 Saetzen.',
	'Schreibe ein kurzes Haiku ueber Programmierung.',
	'Was ist der Unterschied zwischen TCP und UDP? Kurz.',
	'Nenne 3 Vorteile von Self-Hosting.',
];

export default function () {
	const prompt = prompts[Math.floor(Math.random() * prompts.length)];

	// Non-streaming request for easier metrics
	const res = http.post(
		`${OLLAMA_URL}/api/generate`,
		JSON.stringify({
			model: MODEL,
			prompt: prompt,
			stream: false,
			options: {
				num_predict: 100, // Cap tokens to keep tests fast
			},
		}),
		{
			headers: { 'Content-Type': 'application/json' },
			timeout: '60s',
		}
	);

	const ok = check(res, {
		'status is 200': (r) => r.status === 200,
		'has response text': (r) => {
			try {
				const body = JSON.parse(r.body);
				return body.response && body.response.length > 0;
			} catch {
				return false;
			}
		},
	});

	if (ok && res.status === 200) {
		try {
			const body = JSON.parse(res.body);
			// Ollama returns eval_count and eval_duration
			if (body.eval_count && body.eval_duration) {
				const tps = body.eval_count / (body.eval_duration / 1e9);
				tokensPerSec.add(tps);
				totalTokens.add(body.eval_count);
			}
		} catch (_) {}
	}

	errorRate.add(!ok);

	// Longer pause between LLM requests — realistic usage
	sleep(Math.random() * 5 + 3);
}
