// Same as smoke-prod.mjs but explicitly waits for the 'load' event — the
// one that controls whether Chrome's tab spinner keeps spinning. If the
// tab spinner hangs in a real browser but Playwright's .goto({waitUntil:
// 'load'}) resolves quickly, the hang isn't about 'load' — it's about
// some async op kicked off after load that browsers still count as
// "loading" (e.g. service-worker install, web-manifest sub-fetches,
// deferred analytics).
//
// Also dumps ALL non-200 or slow requests to see which ones the browser
// is actually waiting on.

import { chromium } from 'playwright';

const URL = process.env.MANA_URL ?? 'https://mana.how/';
const GOTO_TIMEOUT = Number(process.env.MANA_GOTO_TIMEOUT ?? 60_000);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	viewport: { width: 1280, height: 800 },
	userAgent:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
});
const page = await context.newPage();

const requests = new Map();
const errors = [];

page.on('request', (req) => {
	requests.set(req.url() + '#' + req.method(), {
		url: req.url(),
		method: req.method(),
		startedAt: Date.now(),
		resourceType: req.resourceType(),
	});
});
page.on('response', (res) => {
	const k = res.url() + '#' + res.request().method();
	const e = requests.get(k);
	if (e) {
		e.status = res.status();
		e.duration = Date.now() - e.startedAt;
	}
});
page.on('requestfailed', (req) => {
	const k = req.url() + '#' + req.method();
	const e = requests.get(k);
	if (e) {
		e.failure = req.failure()?.errorText ?? 'unknown';
		e.duration = Date.now() - e.startedAt;
	}
});
page.on('pageerror', (err) => errors.push(err.message));

const t0 = Date.now();

let domContentLoadedAt = null;
let loadedAt = null;
page.on('domcontentloaded', () => (domContentLoadedAt = Date.now() - t0));
page.on('load', () => (loadedAt = Date.now() - t0));

try {
	console.log(`→ goto ${URL} (waitUntil=load, timeout=${GOTO_TIMEOUT}ms)`);
	await page.goto(URL, { waitUntil: 'load', timeout: GOTO_TIMEOUT });
	console.log(`✓ load event fired`);
} catch (e) {
	console.log(`✗ goto failed: ${e.message}`);
}

const gotoEnded = Date.now() - t0;

// After load, wait up to 10s more to see if anything starts hanging.
await page.waitForTimeout(10_000);

const pending = [...requests.values()].filter((r) => r.status === undefined && !r.failure);
const failed = [...requests.values()].filter((r) => r.failure);

console.log('');
console.log(`DOMContentLoaded: ${domContentLoadedAt ?? 'never'} ms`);
console.log(`load event:       ${loadedAt ?? 'never'} ms`);
console.log(`goto returned at: ${gotoEnded} ms`);
console.log(`total requests:   ${requests.size}`);
console.log(`still pending after 10s post-load: ${pending.length}`);
if (pending.length) {
	console.log('');
	console.log('─── HANGING ───');
	for (const r of pending) {
		const age = Date.now() - r.startedAt;
		console.log(`  ${age}ms pending  ${r.method} ${r.resourceType}  ${r.url}`);
	}
}
if (failed.length) {
	console.log('');
	console.log('─── FAILED ───');
	for (const r of failed) console.log(`  ${r.failure}  ${r.url}`);
}
console.log('');
console.log(`uncaught pageerrors: ${errors.length}`);
for (const e of errors) console.log(`  ${e}`);

await browser.close();
