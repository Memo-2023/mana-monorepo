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

const DEV_USERS = [
	{
		email: 'dev@manacore.local',
		password: 'devpassword123',
		name: 'Dev User',
	},
	{
		email: 't@t.de',
		password: 'test1234',
		name: 'Test User',
	},
];

const AUTH_URL = process.env.BASE_URL || 'http://localhost:3001';

async function seedDevUser() {
	const databaseUrl =
		process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/manacore';

	console.log('🌱 Seeding dev users...');
	console.log('');

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	try {
		for (const devUser of DEV_USERS) {
			console.log(`Processing: ${devUser.email}`);

			// Check if user already exists
			const existingUsers = await db.select().from(users).where(eq(users.email, devUser.email));

			if (existingUsers.length > 0) {
				// User exists - just make sure email is verified
				await db.update(users).set({ emailVerified: true }).where(eq(users.email, devUser.email));
				console.log(`   ✅ User already exists, email verification ensured.`);
				continue;
			}

			// Register user via HTTP API (auth server must be running)
			console.log(`   📡 Registering via API at ${AUTH_URL}...`);

			const response = await fetch(`${AUTH_URL}/api/v1/auth/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: devUser.email,
					password: devUser.password,
					name: devUser.name,
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				console.error(`   ❌ Registration failed: ${response.status} - ${error}`);
				continue;
			}

			const result = await response.json();
			console.log(`   User created with ID: ${result.user?.id || 'unknown'}`);

			// Set emailVerified to true (skip email verification for dev user)
			await db.update(users).set({ emailVerified: true }).where(eq(users.email, devUser.email));
			console.log(`   ✅ User created and email verified!`);
		}

		console.log('');
		console.log('Dev users ready:');
		for (const devUser of DEV_USERS) {
			console.log(`   Email: ${devUser.email}`);
			console.log(`   Password: ${devUser.password}`);
			console.log('');
		}
	} catch (error) {
		if (error instanceof Error && error.message.includes('fetch')) {
			console.error('');
			console.error('❌ Could not connect to auth server!');
			console.error('   Make sure the auth server is running:');
			console.error('   pnpm dev:auth');
			console.error('');
		} else {
			console.error('❌ Error seeding dev users:', error);
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
