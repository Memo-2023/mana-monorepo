#!/usr/bin/env node

// Migration script to convert use_username links to username-prefixed short_codes
// Run this script to update existing links in the database

import PocketBase from 'pocketbase';

const pb = new PocketBase('http://localhost:8090');

async function migrate() {
	try {
		console.log('Starting migration...');
		console.log('This script will update links with use_username=true to use the new format');
		
		// Get all links with use_username=true
		const links = await pb.collection('links').getFullList({
			filter: 'use_username = true',
			expand: 'user_id'
		});
		
		console.log(`Found ${links.length} links to migrate`);
		
		let successCount = 0;
		let errorCount = 0;
		let skippedCount = 0;
		
		for (const link of links) {
			try {
				// Get the username from the expanded user
				const username = link.expand?.user_id?.username;
				
				if (!username) {
					console.error(`No username found for link ${link.id} (user: ${link.user_id})`);
					errorCount++;
					continue;
				}
				
				// Check if already migrated (contains slash)
				if (link.short_code.includes('/')) {
					console.log(`Link ${link.id} already migrated: ${link.short_code}`);
					skippedCount++;
					continue;
				}
				
				// Create new short_code with username prefix
				const newShortCode = `${username}/${link.short_code}`;
				
				console.log(`Updating link ${link.id}: ${link.short_code} -> ${newShortCode}`);
				
				// Update the link
				await pb.collection('links').update(link.id, {
					short_code: newShortCode
				});
				
				successCount++;
			} catch (error) {
				console.error(`Error migrating link ${link.id}:`, error.message);
				errorCount++;
			}
		}
		
		console.log('\n=== Migration Summary ===');
		console.log(`✅ Successfully migrated: ${successCount} links`);
		console.log(`⏭️  Skipped (already migrated): ${skippedCount} links`);
		console.log(`❌ Errors: ${errorCount} links`);
		
		if (successCount > 0) {
			console.log('\n⚠️  Important: The use_username field should be removed from the collection schema');
			console.log('You can do this manually in PocketBase Admin UI');
		}
		
	} catch (error) {
		console.error('Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrate();