import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SpaceSyncService {
	private readonly supabaseServiceClient: SupabaseClient;
	private readonly logger = new Logger(SpaceSyncService.name);

	constructor(private configService: ConfigService) {
		const supabaseUrl = this.configService.get<string>('MEMORO_SUPABASE_URL');
		const supabaseServiceKey = this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY');

		if (!supabaseUrl || !supabaseServiceKey) {
			throw new Error('Supabase configuration not provided');
		}

		this.supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey);
		this.logger.log('SpaceSyncService initialized with Supabase service client');
	}

	/**
	 * Synchronizes a user's space membership to Supabase
	 * @param spaceId ID of the space
	 * @param userId ID of the user
	 * @param role Role of the user in the space
	 * @param addedBy ID of the user who added this member (optional)
	 */
	async syncSpaceMembership(
		spaceId: string,
		userId: string,
		role: string,
		addedBy?: string
	): Promise<void> {
		try {
			this.logger.debug(
				`Syncing membership for user ${userId} in space ${spaceId} with role ${role}`
			);

			const { error } = await this.supabaseServiceClient.from('space_members').upsert(
				{
					space_id: spaceId,
					user_id: userId,
					role: role,
					added_at: new Date(),
					added_by: addedBy || userId,
				},
				{
					onConflict: 'space_id,user_id',
				}
			);

			if (error) {
				this.logger.error(`Failed to sync space membership: ${error.message}`, error);
				throw new Error(`Failed to sync space membership: ${error.message}`);
			}

			this.logger.log(
				`Successfully synced user ${userId} membership to space ${spaceId} with role ${role}`
			);
		} catch (error) {
			this.logger.error('Error syncing space membership:', error);
			throw error;
		}
	}

	/**
	 * Removes a user's space membership in Supabase
	 * @param spaceId ID of the space
	 * @param userId ID of the user to remove
	 */
	async removeSpaceMembership(spaceId: string, userId: string): Promise<void> {
		try {
			this.logger.debug(`Removing membership for user ${userId} from space ${spaceId}`);

			const { error } = await this.supabaseServiceClient
				.from('space_members')
				.delete()
				.eq('space_id', spaceId)
				.eq('user_id', userId);

			if (error) {
				this.logger.error(`Failed to remove space membership: ${error.message}`, error);
				throw new Error(`Failed to remove space membership: ${error.message}`);
			}

			this.logger.log(`Successfully removed user ${userId} from space ${spaceId}`);
		} catch (error) {
			this.logger.error('Error removing space membership:', error);
			throw error;
		}
	}

	/**
	 * Bulk synchronize all members for a space
	 * @param spaceId ID of the space
	 * @param members Array of member objects with userId, role, and optional addedBy
	 */
	async syncAllSpaceMembers(
		spaceId: string,
		members: { userId: string; role: string; addedBy?: string }[]
	): Promise<void> {
		try {
			this.logger.debug(`Bulk syncing ${members.length} members for space ${spaceId}`);

			// First, remove all existing members for this space to avoid stale entries
			await this.clearAllSpaceMembers(spaceId);

			// If there are no members to sync, we're done
			if (members.length === 0) {
				this.logger.log(`No members to sync for space ${spaceId}`);
				return;
			}

			const memberRecords = members.map((member) => ({
				space_id: spaceId,
				user_id: member.userId,
				role: member.role,
				added_at: new Date(),
				added_by: member.addedBy || member.userId,
			}));

			const { error } = await this.supabaseServiceClient
				.from('space_members')
				.upsert(memberRecords, {
					onConflict: 'space_id,user_id',
				});

			if (error) {
				this.logger.error(`Failed to bulk sync space members: ${error.message}`, error);
				throw new Error(`Failed to bulk sync space members: ${error.message}`);
			}

			this.logger.log(`Successfully synced ${members.length} members to space ${spaceId}`);
		} catch (error) {
			this.logger.error('Error bulk syncing space members:', error);
			throw error;
		}
	}

	/**
	 * Clears all members for a space
	 * @param spaceId ID of the space
	 */
	private async clearAllSpaceMembers(spaceId: string): Promise<void> {
		try {
			this.logger.debug(`Clearing all members for space ${spaceId}`);

			const { error } = await this.supabaseServiceClient
				.from('space_members')
				.delete()
				.eq('space_id', spaceId);

			if (error) {
				this.logger.error(`Failed to clear space members: ${error.message}`, error);
				throw new Error(`Failed to clear space members: ${error.message}`);
			}

			this.logger.log(`Successfully cleared all members from space ${spaceId}`);
		} catch (error) {
			this.logger.error('Error clearing space members:', error);
			throw error;
		}
	}

	/**
	 * Check if the space_members table exists
	 * @returns Boolean indicating if the table exists
	 */
	async checkSpaceMembersTableExists(): Promise<boolean> {
		try {
			// Try to query the table to see if it exists
			const { data, error } = await this.supabaseServiceClient
				.from('space_members')
				.select('id')
				.limit(1);

			if (error && error.code === '42P01') {
				// Table doesn't exist error
				return false;
			}

			return true;
		} catch (error) {
			this.logger.error('Error checking space_members table existence:', error);
			return false;
		}
	}

	/**
	 * Run the migration to create the space_members table and RLS policies
	 * @param sqlContent SQL content to run (if not provided, uses default migration)
	 * @returns Object with success status and message
	 */
	async runSpaceMembersMigration(
		sqlContent?: string
	): Promise<{ success: boolean; message: string }> {
		try {
			// Check if table already exists
			const tableExists = await this.checkSpaceMembersTableExists();
			if (tableExists) {
				this.logger.log('space_members table already exists, skipping migration');
				return { success: true, message: 'space_members table already exists' };
			}

			this.logger.log('Running space_members table migration');

			// Use the provided SQL content or a default migration
			const sql =
				sqlContent ||
				`
        -- Create the space_members table for synchronized space membership
        CREATE TABLE IF NOT EXISTS space_members (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          space_id UUID NOT NULL,
          user_id UUID NOT NULL,
          role TEXT NOT NULL,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          added_by UUID,
          UNIQUE(space_id, user_id)
        );
        
        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_space_members_user_id ON space_members(user_id);
        CREATE INDEX IF NOT EXISTS idx_space_members_space_id ON space_members(space_id);
        
        -- Enable RLS on the table
        ALTER TABLE space_members ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for space_members table
        CREATE POLICY "Users can see space membership they are part of"
        ON space_members FOR SELECT
        USING (
          user_id = auth.uid() OR
          space_id IN (
            SELECT space_id FROM space_members
            WHERE user_id = auth.uid()
          )
        );
        
        -- Update memo policies to allow access to memos in spaces user is member of
        CREATE POLICY "Users can view memos in spaces they are members of" 
        ON memos FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM memo_spaces ms
            JOIN space_members sm ON ms.space_id = sm.space_id
            WHERE ms.memo_id = memos.id 
            AND sm.user_id = auth.uid()
          )
        );
        
        -- Policy for memo_spaces table to allow viewing of memo-space relationships
        CREATE POLICY "Users can see memo-space links for spaces they are members of"
        ON memo_spaces FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM space_members
            WHERE space_members.space_id = memo_spaces.space_id
            AND space_members.user_id = auth.uid()
          )
        );
      `;

			// Execute the SQL migration using the service role client
			const { error } = await this.supabaseServiceClient.rpc('pgmoon', { query: sql });

			if (error) {
				this.logger.error('Error running space_members migration:', error);
				return { success: false, message: `Migration failed: ${error.message}` };
			}

			this.logger.log('Successfully ran space_members table migration');
			return {
				success: true,
				message: 'Successfully created space_members table and RLS policies',
			};
		} catch (error) {
			this.logger.error('Error running space_members migration:', error);
			return { success: false, message: `Migration failed: ${error.message}` };
		}
	}
}
