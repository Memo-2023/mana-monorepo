/**
 * Seed Dev User Script
 *
 * Creates a development user for easy local testing.
 * Run with: pnpm db:seed:dev
 *
 * IMPORTANT: The auth server must be running for this script to work!
 * Start it first with: pnpm start:dev
 *
 * Credentials:
 *   Email: dev@manacore.local
 *   Password: devpassword123
 */

import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './schema/auth.schema';
import { eq } from 'drizzle-orm';

// Load environment variables
config();

const DEV_USER = {
	email: 'dev@manacore.local',
	password: 'devpassword123',
	name: 'Dev User',
};

const AUTH_URL = process.env.BASE_URL || 'http://localhost:3001';

async function seedDevUser() {
	const databaseUrl =
		process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/manacore';

	console.log('🌱 Seeding dev user...');
	console.log(`   Email: ${DEV_USER.email}`);
	console.log(`   Password: ${DEV_USER.password}`);
	console.log('');

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	try {
		// Check if user already exists
		const existingUsers = await db.select().from(users).where(eq(users.email, DEV_USER.email));

		if (existingUsers.length > 0) {
			// User exists - just make sure email is verified
			await db.update(users).set({ emailVerified: true }).where(eq(users.email, DEV_USER.email));

			console.log('✅ Dev user already exists, email verification ensured.');
			await connection.end();
			return;
		}

		// Register user via HTTP API (auth server must be running)
		console.log(`📡 Registering user via API at ${AUTH_URL}...`);

		const response = await fetch(`${AUTH_URL}/api/v1/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: DEV_USER.email,
				password: DEV_USER.password,
				name: DEV_USER.name,
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Registration failed: ${response.status} - ${error}`);
		}

		const result = await response.json();
		console.log(`   User created with ID: ${result.user?.id || 'unknown'}`);

		// Set emailVerified to true (skip email verification for dev user)
		await db.update(users).set({ emailVerified: true }).where(eq(users.email, DEV_USER.email));

		console.log('✅ Dev user created and email verified!');
		console.log('');
		console.log('You can now login with:');
		console.log(`   Email: ${DEV_USER.email}`);
		console.log(`   Password: ${DEV_USER.password}`);
	} catch (error) {
		if (error instanceof Error && error.message.includes('fetch')) {
			console.error('');
			console.error('❌ Could not connect to auth server!');
			console.error('   Make sure the auth server is running:');
			console.error('   pnpm dev:auth');
			console.error('');
		} else {
			console.error('❌ Error seeding dev user:', error);
		}
		throw error;
	} finally {
		await connection.end();
	}
}

// Run the seed
seedDevUser()
	.then(() => {
		process.exit(0);
	})
	.catch(() => {
		process.exit(1);
	});
