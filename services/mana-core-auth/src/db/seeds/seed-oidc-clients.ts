/**
 * Seed Script: OIDC Clients
 *
 * This script creates the OIDC client entries for services that use
 * Mana Core Auth as their OIDC Provider (e.g., Matrix/Synapse).
 *
 * Usage:
 *   pnpm db:seed:oidc
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string
 *   SYNAPSE_OIDC_CLIENT_SECRET - Client secret for Synapse (generate with: openssl rand -hex 32)
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { oauthApplications } from '../schema/auth.schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Load environment variables
import 'dotenv/config';

// Generate a secure random ID
function generateId(): string {
	return randomBytes(16).toString('hex');
}

async function seed() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		console.error('❌ DATABASE_URL environment variable is required');
		process.exit(1);
	}

	const client = postgres(databaseUrl);
	const db = drizzle(client);

	console.log('🌱 Seeding OIDC clients...\n');

	// Get or generate Synapse client secret
	const synapseClientSecret =
		process.env.SYNAPSE_OIDC_CLIENT_SECRET || randomBytes(32).toString('hex');

	if (!process.env.SYNAPSE_OIDC_CLIENT_SECRET) {
		console.log('⚠️  No SYNAPSE_OIDC_CLIENT_SECRET provided, generated new secret:');
		console.log(`   ${synapseClientSecret}`);
		console.log('   Add this to your .env and Synapse configuration!\n');
	}

	// Check if Synapse client already exists
	const existingClient = await db
		.select()
		.from(oauthApplications)
		.where(eq(oauthApplications.clientId, 'synapse'))
		.limit(1);

	if (existingClient.length > 0) {
		console.log('ℹ️  Synapse OIDC client already exists, updating...');

		await db
			.update(oauthApplications)
			.set({
				clientSecret: synapseClientSecret,
				redirectURLs: JSON.stringify(['https://matrix.mana.how/_synapse/client/oidc/callback']),
				updatedAt: new Date(),
			})
			.where(eq(oauthApplications.clientId, 'synapse'));

		console.log('✅ Synapse OIDC client updated\n');
	} else {
		console.log('📝 Creating Synapse OIDC client...');

		await db.insert(oauthApplications).values({
			id: generateId(),
			name: 'Matrix Synapse',
			icon: 'https://matrix.org/images/matrix-logo.svg',
			clientId: 'synapse',
			clientSecret: synapseClientSecret,
			redirectURLs: JSON.stringify(['https://matrix.mana.how/_synapse/client/oidc/callback']),
			type: 'web',
			disabled: false,
			metadata: JSON.stringify({
				description: 'Matrix Synapse homeserver for DSGVO-compliant messaging',
				trusted: true,
				skipConsent: true,
			}),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		console.log('✅ Synapse OIDC client created\n');
	}

	// Summary
	console.log('📋 OIDC Client Summary:');
	console.log('   Client ID:     synapse');
	console.log(`   Client Secret: ${synapseClientSecret.substring(0, 8)}...`);
	console.log('   Redirect URL:  https://matrix.mana.how/_synapse/client/oidc/callback');
	console.log('\n🔐 Next steps:');
	console.log('   1. Add SYNAPSE_OIDC_CLIENT_SECRET to Synapse environment');
	console.log('   2. Restart Synapse to pick up OIDC configuration');
	console.log('   3. Test SSO flow via Element Web\n');

	await client.end();
	console.log('✨ Seeding complete!');
}

seed().catch((error) => {
	console.error('❌ Seeding failed:', error);
	process.exit(1);
});
