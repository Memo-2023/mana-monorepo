// Headless diagnostic: load mana.how like a fresh incognito tab, capture
// every signal a browser would expose (console, network, uncaught errors,
// pending requests after N seconds, final DOM state). Prints a tight
// report — no side effects.

import { chromium } from 'playwright';

const URL = process.env.MANA_URL ?? 'https://mana.how/';
const WAIT_MS = Number(process.env.MANA_WAIT_MS ?? 30_000);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
	// Fresh context = no cookies, no storage — closest we get to incognito.
	storageState: undefined,
	viewport: { width: 1280, height: 800 },
	userAgent:
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
});
const page = await context.newPage();

/** @type {Array<{level: string, text: string, location?: string}>} */
const consoleEntries = [];
/** @type {Array<{type: string, message: string, stack?: string}>} */
const errors = [];
/** @type {Map<string, {url: string, method: string, startedAt: number, status?: number, failure?: string, duration?: number, resourceType: string}>} */
const requests = new Map();

page.on('console', (msg) => {
	consoleEntries.push({
		level: msg.type(),
		text: msg.text(),
		location: msg.location()?.url,
	});
});

page.on('pageerror', (err) => {
	errors.push({ type: 'pageerror', message: err.message, stack: err.stack });
});

page.on('crash', () => {
	errors.push({ type: 'crash', message: 'page crashed' });
});

page.on('request', (req) => {
	requests.set(req.url() + '#' + req.method(), {
		url: req.url(),
		method: req.method(),
		startedAt: Date.now(),
		resourceType: req.resourceType(),
	});
});

page.on('response', async (res) => {
	const key = res.url() + '#' + res.request().method();
	const entry = requests.get(key);
	if (entry) {
		entry.status = res.status();
		entry.duration = Date.now() - entry.startedAt;
	}
});

page.on('requestfailed', (req) => {
	const key = req.url() + '#' + req.method();
	const entry = requests.get(key);
	if (entry) {
		entry.failure = req.failure()?.errorText ?? 'unknown';
		entry.duration = Date.now() - entry.startedAt;
	}
});

const startedAt = Date.now();
console.log(`→ loading ${URL}  (wait up to ${WAIT_MS / 1000}s)`);

let navError = null;
try {
	// Don't wait for networkidle — that's precisely what's broken. Just
	// fire the navigation and let our WAIT_MS budget decide when to look.
	await page.goto(URL, { waitUntil: 'commit', timeout: 15_000 });
} catch (e) {
	navError = e.message;
}

// Let the page chew on JS for the wait budget, then snapshot.
await page.waitForTimeout(WAIT_MS);
const elapsed = Date.now() - startedAt;

const title = await page.title().catch(() => '<title failed>');
const bodyText = await page
	.evaluate(() => document.body?.innerText?.slice(0, 500) ?? '')
	.catch(() => '<eval failed>');
const currentURL = page.url();

const pending = [...requests.values()].filter((r) => r.status === undefined && !r.failure);
const failed = [...requests.values()].filter((r) => r.failure);
const slow = [...requests.values()]
	.filter((r) => r.duration && r.duration > 2000 && r.status !== undefined)
	.sort((a, b) => (b.duration ?? 0) - (a.duration ?? 0));
const byStatus = {};
for (const r of requests.values()) {
	if (r.status !== undefined) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
}

console.log('');
console.log('═══ RESULT ═══');
console.log(`elapsed:       ${elapsed}ms`);
console.log(`final URL:     ${currentURL}`);
console.log(`title:         ${title}`);
console.log(`nav error:     ${navError ?? 'none'}`);
console.log('');

console.log('─── body preview (first 500 chars) ───');
console.log(bodyText || '<empty>');
console.log('');

console.log(`─── requests by status (total ${requests.size}) ───`);
for (const [code, count] of Object.entries(byStatus).sort()) {
	console.log(`  ${code}: ${count}`);
}
if (pending.length) {
	console.log('');
	console.log(`─── STILL PENDING after ${WAIT_MS / 1000}s (${pending.length}) ───`);
	for (const r of pending) {
		console.log(`  ${r.method.padEnd(6)} ${r.resourceType.padEnd(8)} ${r.url}`);
	}
}
if (failed.length) {
	console.log('');
	console.log(`─── FAILED (${failed.length}) ───`);
	for (const r of failed) {
		console.log(`  ${r.method.padEnd(6)} ${r.failure?.padEnd(35)} ${r.url}`);
	}
}
if (slow.length) {
	console.log('');
	console.log(`─── slow (>2s, finished) ───`);
	for (const r of slow.slice(0, 10)) {
		console.log(`  ${r.duration}ms  ${r.status}  ${r.url}`);
	}
}

console.log('');
console.log(`─── console messages (${consoleEntries.length}) ───`);
for (const msg of consoleEntries) {
	if (['error', 'warning'].includes(msg.level)) {
		console.log(`  [${msg.level}] ${msg.text}${msg.location ? ' @ ' + msg.location : ''}`);
	}
}
const nonWarn = consoleEntries.filter((m) => !['error', 'warning'].includes(m.level));
if (nonWarn.length) console.log(`  (+${nonWarn.length} log/info/debug suppressed)`);

console.log('');
console.log(`─── uncaught errors (${errors.length}) ───`);
for (const e of errors) {
	console.log(`  [${e.type}] ${e.message}`);
	if (e.stack) console.log(e.stack.split('\n').slice(0, 3).join('\n'));
}

await browser.close();
