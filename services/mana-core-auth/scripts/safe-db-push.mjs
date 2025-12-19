#!/usr/bin/env node
/**
 * Safe db:push wrapper
 *
 * This script wraps drizzle-kit push to prevent accidental execution
 * in production or staging environments.
 *
 * Usage:
 *   pnpm db:push              # Uses this wrapper
 *   pnpm db:push:force        # Bypass safety check (for emergencies only)
 */

import { execSync } from 'child_process';

const NODE_ENV = process.env.NODE_ENV || 'development';
const DATABASE_URL = process.env.DATABASE_URL || '';

// Check for production/staging indicators
const BLOCKED_ENVS = ['production', 'staging', 'prod', 'stage'];
const PROD_HOST_PATTERNS = [
	/\.railway\.app/,
	/\.supabase\.co/,
	/\.neon\.tech/,
	/\.render\.com/,
	/staging\./,
	/prod\./,
	/production\./,
];

function isProductionEnvironment() {
	// Check NODE_ENV
	if (BLOCKED_ENVS.includes(NODE_ENV.toLowerCase())) {
		return { blocked: true, reason: `NODE_ENV is set to '${NODE_ENV}'` };
	}

	// Check DATABASE_URL for production patterns
	for (const pattern of PROD_HOST_PATTERNS) {
		if (pattern.test(DATABASE_URL)) {
			return {
				blocked: true,
				reason: `DATABASE_URL contains production pattern: ${pattern}`,
			};
		}
	}

	// Check for CI/CD environment
	if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
		return { blocked: true, reason: 'Running in CI/CD environment' };
	}

	return { blocked: false };
}

function main() {
	const args = process.argv.slice(2);
	const forceFlag = args.includes('--force') || args.includes('-f');

	console.log('🔒 Safe db:push - Environment Check\n');

	const check = isProductionEnvironment();

	if (check.blocked && !forceFlag) {
		console.log('❌ BLOCKED: db:push is not allowed in this environment\n');
		console.log(`   Reason: ${check.reason}\n`);
		console.log('   db:push can cause data loss and should only be used in development.\n');
		console.log('   For production/staging, use:');
		console.log('     pnpm db:generate  # Generate migration files');
		console.log('     pnpm db:migrate   # Apply migrations safely\n');
		console.log('   If you absolutely need to run db:push (DANGEROUS):');
		console.log('     pnpm db:push:force\n');
		process.exit(1);
	}

	if (check.blocked && forceFlag) {
		console.log('⚠️  WARNING: --force flag detected, bypassing safety check\n');
		console.log(`   Blocked reason was: ${check.reason}\n`);
		console.log('   THIS MAY CAUSE DATA LOSS. Proceeding in 5 seconds...\n');

		// Give user time to cancel
		execSync('sleep 5');
	}

	console.log('✅ Environment check passed\n');
	console.log('📤 Running drizzle-kit push...\n');

	try {
		// Pass through any additional args (except --force)
		const drizzleArgs = args.filter((arg) => arg !== '--force' && arg !== '-f').join(' ');
		execSync(`pnpm drizzle-kit push ${drizzleArgs}`, { stdio: 'inherit' });
	} catch {
		process.exit(1);
	}
}

main();
