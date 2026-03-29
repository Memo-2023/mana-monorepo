// Script to add account_owner field to links collection
// Run this with: node src/lib/scripts/update-links-collection.js

import PocketBase from 'pocketbase';

// Use environment variable or fallback to production
const POCKETBASE_URL = process.env.PUBLIC_POCKETBASE_URL || 'https://pb.ulo.ad';
const pb = new PocketBase(POCKETBASE_URL);

console.log(`Connecting to PocketBase at: ${POCKETBASE_URL}`);

// You'll need to authenticate as admin first
// This is just a placeholder - do not commit real credentials
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

async function updateLinksCollection() {
	try {
		// Authenticate as admin
		await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
		console.log('✅ Authenticated as admin');

		// Get the current links collection
		const collection = await pb.collections.getOne('links');
		console.log('✅ Retrieved links collection');

		// Add account_owner field to the existing fields
		const updatedFields = [...collection.fields];

		// Check if account_owner already exists
		const hasAccountOwner = updatedFields.some((f) => f.name === 'account_owner');
		if (!hasAccountOwner) {
			// Insert account_owner field after user_id
			const userIdIndex = updatedFields.findIndex((f) => f.name === 'user_id');
			updatedFields.splice(userIdIndex + 1, 0, {
				name: 'account_owner',
				type: 'relation',
				required: false,
				collectionId: '_pb_users_auth_',
				cascadeDelete: false,
				maxSelect: 1,
				minSelect: 0,
			});
		}

		// Update the collection
		await pb.collections.update('links', {
			...collection,
			fields: updatedFields,
			// Update rules to include account_owner checks
			listRule:
				'user_id = @request.auth.id || created_by = @request.auth.id || account_owner = @request.auth.id || is_active = true',
			viewRule:
				'user_id = @request.auth.id || created_by = @request.auth.id || account_owner = @request.auth.id || is_active = true',
			updateRule:
				'created_by = @request.auth.id || (account_owner = @request.auth.id && created_by = @request.auth.id)',
			deleteRule:
				'created_by = @request.auth.id || (account_owner = @request.auth.id && created_by = @request.auth.id)',
		});

		console.log('✅ Successfully updated links collection with account_owner field');

		// Migrate existing data: set account_owner = user_id for all existing links
		console.log('🔄 Migrating existing links...');

		const allLinks = await pb.collection('links').getFullList();
		let migrated = 0;

		for (const link of allLinks) {
			if (!link.account_owner && link.user_id) {
				await pb.collection('links').update(link.id, {
					account_owner: link.user_id,
					created_by: link.created_by || link.user_id,
				});
				migrated++;
			}
		}

		console.log(`✅ Migrated ${migrated} existing links`);
	} catch (error) {
		console.error('❌ Error:', error);
		process.exit(1);
	}
}

// Run the update
updateLinksCollection();
