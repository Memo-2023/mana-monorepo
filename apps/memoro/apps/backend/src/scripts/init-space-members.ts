/**
 * Script to initialize the space_members table with existing space memberships
 *
 * This script:
 * 1. Creates the space_members table if it doesn't exist
 * 2. Synchronizes all existing spaces and their members
 *
 * Usage:
 * npx ts-node src/scripts/init-space-members.ts
 */

import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

// Create a separate logger for the script
const logger = {
	log: (message: string) => console.log(`[INFO] ${message}`),
	error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error || ''),
	warn: (message: string) => console.warn(`[WARN] ${message}`),
	debug: (message: string) => console.debug(`[DEBUG] ${message}`),
};

// Configuration
const memoroUrl = process.env.MEMORO_SUPABASE_URL;
const memoroServiceKey = process.env.MEMORO_SUPABASE_SERVICE_KEY;
const middlewareUrl = process.env.MANA_CORE_URL || 'http://localhost:3000';
const adminToken = process.env.ADMIN_TOKEN; // You'll need to provide this

if (!memoroUrl || !memoroServiceKey) {
	logger.error(
		'Missing required environment variables: MEMORO_SUPABASE_URL, MEMORO_SUPABASE_SERVICE_KEY'
	);
	process.exit(1);
}

if (!adminToken) {
	logger.warn('No ADMIN_TOKEN provided - you will need to authenticate to access space data');
}

// Create Supabase client with service role
const supabase = createClient(memoroUrl, memoroServiceKey);

/**
 * Creates the space_members table and sets up RLS policies
 */
async function createSpaceMembersTable() {
	logger.log('Checking if space_members table exists...');

	try {
		// Try to query the table to see if it exists
		const { data, error } = await supabase.from('space_members').select('id').limit(1);

		if (error && error.code === '42P01') {
			// Table doesn't exist, create it
			logger.log('space_members table does not exist, creating...');

			// Read the migration SQL from file
			const migrationPath = path.join(__dirname, '..', 'migrations', 'create-space-members.sql');
			if (!fs.existsSync(migrationPath)) {
				logger.error(`Migration file not found at ${migrationPath}`);
				return false;
			}

			const sql = fs.readFileSync(migrationPath, 'utf8');

			// Execute the SQL
			const { error: migrationError } = await supabase.rpc('pgmoon', { query: sql });

			if (migrationError) {
				logger.error('Error creating space_members table:', migrationError);
				return false;
			}

			logger.log('Successfully created space_members table and RLS policies');
			return true;
		} else if (error) {
			logger.error('Error checking if space_members table exists:', error);
			return false;
		} else {
			logger.log('space_members table already exists');
			return true;
		}
	} catch (error) {
		logger.error('Unexpected error creating space_members table:', error);
		return false;
	}
}

/**
 * Fetches all spaces from the middleware
 */
async function getAllSpaces() {
	try {
		logger.log('Fetching all spaces from middleware...');

		const response = await axios.get(`${middlewareUrl}/spaces/all`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (response.data && response.data.spaces) {
			logger.log(`Found ${response.data.spaces.length} spaces`);
			return response.data.spaces;
		} else {
			logger.warn('No spaces found or unexpected response format');
			return [];
		}
	} catch (error) {
		logger.error('Error fetching spaces:', error);
		return [];
	}
}

/**
 * Fetches space details including members
 */
async function getSpaceDetails(spaceId: string) {
	try {
		logger.log(`Fetching details for space ${spaceId}...`);

		const response = await axios.get(`${middlewareUrl}/spaces/${spaceId}`, {
			headers: {
				Authorization: `Bearer ${adminToken}`,
				'Content-Type': 'application/json',
			},
		});

		if (response.data && response.data.space) {
			return response.data.space;
		} else {
			logger.warn(`No details found for space ${spaceId} or unexpected response format`);
			return null;
		}
	} catch (error) {
		logger.error(`Error fetching space details for ${spaceId}:`, error);
		return null;
	}
}

/**
 * Synchronizes members for a space
 */
async function syncSpaceMembers(spaceId: string, spaceDetails: any) {
	try {
		logger.log(`Syncing members for space ${spaceId}...`);

		if (!spaceDetails.roles || !spaceDetails.roles.members) {
			logger.warn(`No members found for space ${spaceId}`);
			return;
		}

		const members = [];

		// Extract members from space details
		for (const [userId, memberInfo] of Object.entries(spaceDetails.roles.members)) {
			members.push({
				space_id: spaceId,
				user_id: userId,
				role: (memberInfo as any).role,
				added_at: new Date(),
				added_by: (memberInfo as any).added_by || userId,
			});
		}

		logger.log(`Found ${members.length} members for space ${spaceId}`);

		// Clear existing members for this space
		const { error: deleteError } = await supabase
			.from('space_members')
			.delete()
			.eq('space_id', spaceId);

		if (deleteError) {
			logger.error(`Error clearing existing members for space ${spaceId}:`, deleteError);
			return;
		}

		// Insert new members
		if (members.length > 0) {
			const { error: insertError } = await supabase.from('space_members').insert(members);

			if (insertError) {
				logger.error(`Error inserting members for space ${spaceId}:`, insertError);
				return;
			}
		}

		logger.log(`Successfully synced ${members.length} members for space ${spaceId}`);
	} catch (error) {
		logger.error(`Error syncing members for space ${spaceId}:`, error);
	}
}

/**
 * Main function to run the script
 */
async function main() {
	try {
		logger.log('Starting space_members initialization...');

		// Create the space_members table if it doesn't exist
		const tableCreated = await createSpaceMembersTable();
		if (!tableCreated) {
			logger.error('Failed to create space_members table, exiting');
			process.exit(1);
		}

		// Get all spaces
		const spaces = await getAllSpaces();
		if (spaces.length === 0) {
			logger.warn('No spaces found, nothing to sync');
			process.exit(0);
		}

		// Sync members for each space
		let successCount = 0;
		let failCount = 0;

		for (const space of spaces) {
			try {
				const spaceDetails = await getSpaceDetails(space.id);
				if (spaceDetails) {
					await syncSpaceMembers(space.id, spaceDetails);
					successCount++;
				} else {
					logger.warn(`Skipping space ${space.id} due to missing details`);
					failCount++;
				}
			} catch (error) {
				logger.error(`Error processing space ${space.id}:`, error);
				failCount++;
			}
		}

		logger.log(`Finished syncing space members: ${successCount} succeeded, ${failCount} failed`);
		process.exit(0);
	} catch (error) {
		logger.error('Unexpected error in main function:', error);
		process.exit(1);
	}
}

// Run the script
main();
