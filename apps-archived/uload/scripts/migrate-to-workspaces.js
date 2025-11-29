#!/usr/bin/env node

/**
 * Migration script to convert from shared_access to workspace system
 * Run this after deploying the new workspace collections
 */

import PocketBase from 'pocketbase';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.production' });

const pb = new PocketBase(process.env.PUBLIC_POCKETBASE_URL || 'https://pb.ulo.ad');

async function migrate() {
	console.log('Starting migration to workspace system...');

	try {
		// Authenticate as admin
		const adminEmail = process.env.ADMIN_EMAIL;
		const adminPassword = process.env.ADMIN_PASSWORD;

		if (!adminEmail || !adminPassword) {
			console.error('Please set ADMIN_EMAIL and ADMIN_PASSWORD in .env.production');
			process.exit(1);
		}

		await pb.admins.authWithPassword(adminEmail, adminPassword);
		console.log('✓ Authenticated as admin');

		// Get all users
		const users = await pb.collection('users').getFullList();
		console.log(`Found ${users.length} users to migrate`);

		// Create personal workspace for each user
		for (const user of users) {
			try {
				// Check if personal workspace already exists
				const existingWorkspaces = await pb.collection('workspaces').getList(1, 1, {
					filter: `owner="${user.id}" && type="personal"`,
				});

				if (existingWorkspaces.items.length === 0) {
					// Create personal workspace
					const workspace = await pb.collection('workspaces').create({
						name: `${user.name || user.email}'s Workspace`,
						owner: user.id,
						type: 'personal',
						subscription_status: user.subscription_status || 'free',
						description: 'Personal workspace',
					});

					console.log(`✓ Created personal workspace for ${user.email}`);

					// Add user as owner in workspace_members
					await pb.collection('workspace_members').create({
						workspace: workspace.id,
						user: user.id,
						role: 'owner',
						invitation_status: 'accepted',
						accepted_at: new Date().toISOString(),
					});
				} else {
					console.log(`- Personal workspace already exists for ${user.email}`);
				}
			} catch (error) {
				console.error(`✗ Error creating workspace for ${user.email}:`, error.message);
			}
		}

		// Migrate shared_access to workspace_members
		console.log('\nMigrating shared access...');

		try {
			const sharedAccess = await pb.collection('shared_access').getFullList({
				expand: 'owner,user',
			});

			console.log(`Found ${sharedAccess.length} shared access records`);

			for (const access of sharedAccess) {
				try {
					// Find or create team workspace for the owner
					let teamWorkspace;
					const existingTeamWorkspaces = await pb.collection('workspaces').getList(1, 1, {
						filter: `owner="${access.owner}" && type="team"`,
					});

					if (existingTeamWorkspaces.items.length === 0) {
						// Create team workspace
						const ownerData = access.expand?.owner;
						teamWorkspace = await pb.collection('workspaces').create({
							name: `${ownerData?.name || ownerData?.email}'s Team`,
							owner: access.owner,
							type: 'team',
							description: 'Team workspace for collaboration',
						});

						console.log(`✓ Created team workspace for owner ${access.owner}`);

						// Add owner as owner in workspace_members
						await pb.collection('workspace_members').create({
							workspace: teamWorkspace.id,
							user: access.owner,
							role: 'owner',
							invitation_status: 'accepted',
							accepted_at: new Date().toISOString(),
						});
					} else {
						teamWorkspace = existingTeamWorkspaces.items[0];
					}

					// Check if member already exists
					const existingMembers = await pb.collection('workspace_members').getList(1, 1, {
						filter: `workspace="${teamWorkspace.id}" && user="${access.user}"`,
					});

					if (existingMembers.items.length === 0) {
						// Add team member
						await pb.collection('workspace_members').create({
							workspace: teamWorkspace.id,
							user: access.user,
							role: access.permissions?.manage_team ? 'admin' : 'member',
							permissions: access.permissions,
							invitation_status: access.invitation_status,
							invitation_token: access.invitation_token,
							invited_at: access.invited_at,
							accepted_at: access.accepted_at,
						});

						console.log(`✓ Migrated team member ${access.user} to workspace ${teamWorkspace.id}`);
					} else {
						console.log(`- Team member ${access.user} already exists in workspace`);
					}
				} catch (error) {
					console.error(`✗ Error migrating shared access ${access.id}:`, error.message);
				}
			}
		} catch (error) {
			console.error('✗ Error fetching shared access:', error.message);
		}

		console.log('\n✅ Migration completed successfully!');
		console.log('\nNext steps:');
		console.log('1. Test the new workspace system');
		console.log('2. Update any links/cards to reference workspace instead of owner');
		console.log('3. Once verified, you can remove the old shared_access collection');
	} catch (error) {
		console.error('✗ Migration failed:', error);
		process.exit(1);
	}
}

// Run migration
migrate().catch(console.error);
