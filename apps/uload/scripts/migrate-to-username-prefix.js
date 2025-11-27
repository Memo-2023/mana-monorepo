#!/usr/bin/env node

// Migration script to convert use_username links to username-prefixed short_codes
// This script:
// 1. Finds all links with use_username=true
// 2. Updates their short_code to include the username prefix
// 3. Removes the use_username field (done via PocketBase admin)

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

async function migrate() {
	try {
		// Authenticate as admin (update with your credentials)
		await pb.admins.authWithPassword('admin@example.com', 'your-password');

		console.log('Fetching all links with use_username=true...');

		// Get all links with use_username=true
		const links = await pb.collection('links').getFullList({
			filter: 'use_username = true',
			expand: 'user_id',
		});

		console.log(`Found ${links.length} links to migrate`);

		let successCount = 0;
		let errorCount = 0;

		for (const link of links) {
			try {
				// Get the username from the expanded user
				const username = link.expand?.user_id?.username;

				if (!username) {
					console.error(`No username found for link ${link.id} (user: ${link.user_id})`);
					errorCount++;
					continue;
				}

				// Create new short_code with username prefix
				const newShortCode = `${username}/${link.short_code}`;

				console.log(`Updating link ${link.id}: ${link.short_code} -> ${newShortCode}`);

				// Update the link
				await pb.collection('links').update(link.id, {
					short_code: newShortCode,
				});

				successCount++;
			} catch (error) {
				console.error(`Error migrating link ${link.id}:`, error);
				errorCount++;
			}
		}

		console.log('\nMigration complete!');
		console.log(`✅ Successfully migrated: ${successCount} links`);
		console.log(`❌ Errors: ${errorCount} links`);

		if (successCount > 0) {
			console.log('\n⚠️  Next steps:');
			console.log('1. Remove the use_username field from the links collection in PocketBase admin');
			console.log('2. Test that all migrated links still work');
			console.log('3. Deploy the updated application code');
		}
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrate();
