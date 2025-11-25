#!/usr/bin/env node

/**
 * Seed Script for Local PocketBase Development
 * 
 * This script creates test data for local development.
 * 
 * Usage:
 *   1. Make sure PocketBase is running locally (http://localhost:8090)
 *   2. Run: node scripts/seed-local-db.js
 */

import PocketBase from 'pocketbase';
import { randomBytes } from 'crypto';

// Configuration
const POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL || 'http://localhost:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@localhost';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456';

console.log('🌱 Seeding Local PocketBase Database');
console.log('=====================================\n');
console.log(`📍 PocketBase URL: ${POCKETBASE_URL}`);

const pb = new PocketBase(POCKETBASE_URL);
pb.autoCancellation(false);

// Test data
const testUsers = [
	{
		email: 'test@localhost',
		password: 'test123456',
		passwordConfirm: 'test123456',
		username: 'testuser',
		name: 'Test User',
		emailVisibility: true
	},
	{
		email: 'demo@localhost',
		password: 'demo123456',
		passwordConfirm: 'demo123456',
		username: 'demouser',
		name: 'Demo User',
		emailVisibility: true
	}
];

const testLinks = [
	{
		short_code: 'test1',
		original_url: 'https://example.com',
		title: 'Test Link 1',
		description: 'This is a test link for development',
		is_active: true,
		click_limit: null,
		expires_at: null,
		password: null
	},
	{
		short_code: 'test2',
		original_url: 'https://google.com',
		title: 'Google Test',
		description: 'Link to Google for testing',
		is_active: true,
		click_limit: 100,
		expires_at: null,
		password: null
	},
	{
		short_code: 'protected',
		original_url: 'https://github.com',
		title: 'Protected Link',
		description: 'Password protected link',
		is_active: true,
		click_limit: null,
		expires_at: null,
		password: 'secret123'
	},
	{
		short_code: 'expired',
		original_url: 'https://stackoverflow.com',
		title: 'Expired Link',
		description: 'This link has expired',
		is_active: true,
		click_limit: null,
		expires_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
		password: null
	}
];

async function seedDatabase() {
	try {
		// Step 1: Try to authenticate as admin
		console.log('🔐 Authenticating as admin...');
		try {
			await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
			console.log('✅ Admin authenticated\n');
		} catch (error) {
			console.log('⚠️  Admin auth failed. You may need to:');
			console.log('   1. Create admin account at http://localhost:8090/_/');
			console.log('   2. Update POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD\n');
			
			// Try to continue without admin auth (some operations might fail)
		}

		// Step 2: Create test users
		console.log('👥 Creating test users...');
		const createdUsers = [];
		
		for (const userData of testUsers) {
			try {
				const user = await pb.collection('users').create(userData);
				createdUsers.push(user);
				console.log(`   ✅ Created user: ${userData.email}`);
			} catch (error) {
				if (error.response?.data?.email?.message?.includes('already exists')) {
					console.log(`   ⚠️  User ${userData.email} already exists`);
					// Try to get existing user
					try {
						const users = await pb.collection('users').getList(1, 1, {
							filter: `email = "${userData.email}"`
						});
						if (users.items.length > 0) {
							createdUsers.push(users.items[0]);
						}
					} catch (e) {
						console.log(`   ❌ Could not fetch existing user: ${userData.email}`);
					}
				} else {
					console.log(`   ❌ Failed to create user ${userData.email}:`, error.message);
				}
			}
		}
		console.log('');

		// Step 3: Create test links
		console.log('🔗 Creating test links...');
		
		// Use the first created user as the owner
		const ownerId = createdUsers[0]?.id;
		
		for (const linkData of testLinks) {
			try {
				// Add owner if we have one
				if (ownerId) {
					linkData.user_id = ownerId;
				}
				
				// Generate a random custom code if needed
				if (!linkData.custom_code) {
					linkData.custom_code = linkData.short_code;
				}
				
				const link = await pb.collection('links').create(linkData);
				console.log(`   ✅ Created link: ${linkData.short_code} -> ${linkData.original_url}`);
			} catch (error) {
				if (error.response?.data?.short_code?.message?.includes('already exists')) {
					console.log(`   ⚠️  Link ${linkData.short_code} already exists`);
				} else {
					console.log(`   ❌ Failed to create link ${linkData.short_code}:`, error.message);
				}
			}
		}
		console.log('');

		// Step 4: Create some test clicks
		console.log('📊 Creating test click data...');
		
		try {
			// Get one of the links we created
			const links = await pb.collection('links').getList(1, 1, {
				filter: 'short_code = "test1"'
			});
			
			if (links.items.length > 0) {
				const link = links.items[0];
				
				// Create some fake clicks
				const clickData = [
					{
						link_id: link.id,
						ip_hash: '127.0.0.1',
						user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
						browser: 'Chrome',
						device_type: 'Desktop',
						os: 'macOS',
						country: 'Germany',
						city: 'Munich',
						clicked_at: new Date().toISOString()
					},
					{
						link_id: link.id,
						ip_hash: '192.168.1.1',
						user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
						browser: 'Safari',
						device_type: 'Mobile',
						os: 'iOS',
						country: 'USA',
						city: 'New York',
						clicked_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
					}
				];
				
				for (const click of clickData) {
					try {
						await pb.collection('clicks').create(click);
						console.log(`   ✅ Created test click from ${click.country}`);
					} catch (error) {
						console.log(`   ❌ Failed to create click:`, error.message);
					}
				}
			}
		} catch (error) {
			console.log(`   ⚠️  Could not create click data:`, error.message);
		}
		console.log('');

		// Summary
		console.log('=====================================');
		console.log('🎉 Database seeding complete!\n');
		console.log('📝 Test Accounts:');
		console.log('   Email: test@localhost');
		console.log('   Password: test123456\n');
		console.log('🔗 Test Links:');
		console.log('   http://localhost:5173/test1 - Normal link');
		console.log('   http://localhost:5173/test2 - Link with click limit');
		console.log('   http://localhost:5173/protected - Password: secret123');
		console.log('   http://localhost:5173/expired - Expired link\n');
		console.log('👉 Next: Open http://localhost:5173 and test the app!');

	} catch (error) {
		console.error('❌ Seeding failed:', error);
		process.exit(1);
	}
}

// Run the seeding
seedDatabase().then(() => {
	process.exit(0);
}).catch(error => {
	console.error('Fatal error:', error);
	process.exit(1);
});