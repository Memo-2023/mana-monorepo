#!/usr/bin/env bun
/**
 * Seed the persona catalog into mana-auth.
 *
 * Idempotent: re-running upserts metadata, never duplicates users. New
 * personas in catalog.json get registered; existing ones get their
 * descriptor refreshed.
 *
 * Requires:
 *   - mana-auth running (default http://localhost:3001)
 *   - An admin-tier user JWT (export MANA_ADMIN_JWT or pass --jwt=…)
 *   - PERSONA_SEED_SECRET in env (or accept the dev fallback locally)
 *
 * Usage:
 *   pnpm seed:personas
 *   pnpm seed:personas --auth=https://auth.mana.how --jwt=eyJ…
 */

import { loadCatalog, type PersonaSpec } from './catalog';
import { personaPassword } from './password';

interface CliOptions {
	authUrl: string;
	adminJwt: string;
	dryRun: boolean;
}

function parseArgs(): CliOptions {
	const args = process.argv.slice(2);
	const get = (key: string): string | undefined => {
		const found = args.find((a) => a.startsWith(`--${key}=`));
		return found?.slice(`--${key}=`.length);
	};

	const authUrl = get('auth') ?? process.env.MANA_AUTH_URL ?? 'http://localhost:3001';
	const adminJwt = get('jwt') ?? process.env.MANA_ADMIN_JWT ?? '';
	const dryRun = args.includes('--dry-run');

	if (!adminJwt) {
		console.error(
			'❌ Missing admin JWT. Set MANA_ADMIN_JWT or pass --jwt=… (must be a token for a user with role=admin).'
		);
		process.exit(1);
	}

	return { authUrl, adminJwt, dryRun };
}

async function upsertPersona(opts: CliOptions, p: PersonaSpec): Promise<void> {
	const password = personaPassword(p.email);
	const body = {
		email: p.email,
		name: p.name,
		password,
		archetype: p.archetype,
		systemPrompt: p.systemPrompt,
		moduleMix: p.moduleMix,
		tickCadence: p.tickCadence,
	};

	if (opts.dryRun) {
		console.log(`  · would upsert ${p.email} (${p.archetype})`);
		return;
	}

	const res = await fetch(`${opts.authUrl}/api/v1/admin/personas`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${opts.adminJwt}`,
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		const text = await res.text().catch(() => '<unreadable body>');
		throw new Error(`POST /admin/personas → ${res.status}: ${text.slice(0, 300)}`);
	}

	const result = (await res.json()) as { ok: true; userId: string; email: string };
	console.log(`  ✓ ${result.email}  (${p.archetype})  user=${result.userId.slice(0, 8)}…`);
}

async function main(): Promise<void> {
	const opts = parseArgs();
	const { personas } = loadCatalog();

	console.log(`▸ Persona catalog: ${personas.length} entries`);
	console.log(`▸ Auth URL: ${opts.authUrl}`);
	if (opts.dryRun) console.log('▸ DRY-RUN — no requests will be sent');
	console.log('');

	const failures: Array<{ email: string; error: string }> = [];
	for (const persona of personas) {
		try {
			await upsertPersona(opts, persona);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			console.error(`  ✗ ${persona.email}  — ${msg}`);
			failures.push({ email: persona.email, error: msg });
		}
	}

	console.log('');
	if (failures.length > 0) {
		console.error(`✗ Done with ${failures.length} failure(s).`);
		process.exit(1);
	}
	console.log(`✓ Done. ${personas.length} personas upserted.`);
}

void main();
