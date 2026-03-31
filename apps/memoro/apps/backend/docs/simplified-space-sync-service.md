# Simplified SpaceSyncService

This document outlines a simplified version of the `SpaceSyncService` that leverages the new database-level triggers and denormalized access control approach.

## Simplified Implementation

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SpaceSyncService {
  private readonly logger = new Logger(SpaceSyncService.name);
  private supabase: SupabaseClient;
  private manaApiUrl: string;
  private adminToken: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // Initialize Supabase client
    this.supabase = createClient(
      this.configService.get<string>('MEMORO_SUPABASE_URL'),
      this.configService.get<string>('MEMORO_SUPABASE_SERVICE_KEY'),
    );
    this.manaApiUrl = this.configService.get<string>('MANA_CORE_URL');
    this.adminToken = this.configService.get<string>('ADMIN_TOKEN');
  }

  /**
   * Create or update a space member record
   * This is called when a user is added to a space or their role changes
   */
  async syncSpaceMembership(
    spaceId: string,
    userId: string,
    role: string,
    addedBy?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Generate a UUID for the record if it doesn't exist
      const id = uuidv4();
      
      // Check if the membership already exists
      const { data: existingMember } = await this.supabase
        .from('space_members')
        .select('*')
        .eq('space_id', spaceId)
        .eq('user_id', userId)
        .single();
      
      if (existingMember) {
        // Update existing membership
        const { error } = await this.supabase
          .from('space_members')
          .update({
            role,
            added_by: addedBy || existingMember.added_by,
          })
          .eq('space_id', spaceId)
          .eq('user_id', userId);
        
        if (error) throw error;
        this.logger.log(`Updated space membership for user ${userId} in space ${spaceId}`);
      } else {
        // Create new membership
        const { error } = await this.supabase
          .from('space_members')
          .insert({
            id,
            space_id: spaceId,
            user_id: userId,
            role,
            added_by: addedBy || userId,
            added_at: new Date(),
          });
        
        if (error) throw error;
        this.logger.log(`Added user ${userId} to space ${spaceId}`);
      }

      return { success: true, message: 'Space membership synced successfully' };
    } catch (error) {
      this.logger.error(`Error syncing space membership: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Remove a user from a space
   */
  async removeSpaceMembership(
    spaceId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await this.supabase
        .from('space_members')
        .delete()
        .eq('space_id', spaceId)
        .eq('user_id', userId);
      
      if (error) throw error;
      this.logger.log(`Removed user ${userId} from space ${spaceId}`);
      
      return { success: true, message: 'Space membership removed successfully' };
    } catch (error) {
      this.logger.error(`Error removing space membership: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Sync all members for a specific space
   * Used when initializing a space or ensuring all memberships are in sync
   */
  async syncSpaceMembers(
    spaceId: string,
  ): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      // Fetch space members from middleware
      const response = await firstValueFrom(
        this.httpService.get(`${this.manaApiUrl}/api/spaces/${spaceId}/members`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }),
      );
      
      const members = response.data.members || [];
      
      if (members.length === 0) {
        return { success: true, message: 'No members found for space', count: 0 };
      }
      
      // First, delete all existing members for this space to avoid stale records
      await this.supabase
        .from('space_members')
        .delete()
        .eq('space_id', spaceId);
      
      // Then insert all current members
      const membersToInsert = members.map((member) => ({
        id: uuidv4(),
        space_id: spaceId,
        user_id: member.user_id,
        role: member.role,
        added_by: member.added_by || member.user_id,
        added_at: new Date(),
      }));
      
      const { error } = await this.supabase
        .from('space_members')
        .insert(membersToInsert);
      
      if (error) throw error;
      
      this.logger.log(`Synced ${members.length} members for space ${spaceId}`);
      
      return { 
        success: true, 
        message: `Synced ${members.length} members for space ${spaceId}`,
        count: members.length 
      };
    } catch (error) {
      this.logger.error(`Error syncing space members: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Sync all spaces for a user
   * Used to ensure a user has access to all their spaces
   */
  async syncUserSpaces(
    userId: string,
  ): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      // Fetch user's spaces from middleware
      const response = await firstValueFrom(
        this.httpService.get(`${this.manaApiUrl}/api/users/${userId}/spaces`, {
          headers: { Authorization: `Bearer ${this.adminToken}` },
        }),
      );
      
      const spaces = response.data.spaces || [];
      
      if (spaces.length === 0) {
        return { success: true, message: 'No spaces found for user', count: 0 };
      }
      
      // Process each space the user is a member of
      let successCount = 0;
      for (const space of spaces) {
        const result = await this.syncSpaceMembers(space.id);
        if (result.success) {
          successCount++;
        }
      }
      
      this.logger.log(`Synced ${successCount} spaces for user ${userId}`);
      
      return { 
        success: true, 
        message: `Synced ${successCount} spaces for user ${userId}`,
        count: successCount
      };
    } catch (error) {
      this.logger.error(`Error syncing user spaces: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }

  /**
   * Run the migration to set up the space_members table and triggers
   * Only needs to be run once when setting up a new environment
   */
  async runSpaceMembersMigration(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: tableExists } = await this.supabase.rpc('check_table_exists', {
        table_name: 'space_members',
      });
      
      if (tableExists) {
        return { success: true, message: 'Space members table already exists' };
      }
      
      // Create space_members table
      const createTableSQL = `
      -- Create space_members table
      CREATE TABLE IF NOT EXISTS public.space_members (
        id UUID PRIMARY KEY,
        space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
        user_id UUID NOT NULL,
        role TEXT NOT NULL,
        added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        added_by UUID,
        UNIQUE(space_id, user_id)
      );

      -- Add shared_with_users column to memos table
      ALTER TABLE public.memos ADD COLUMN IF NOT EXISTS shared_with_users UUID[] DEFAULT '{}'::uuid[];

      -- Create function for updating shared_with_users
      CREATE OR REPLACE FUNCTION update_memo_shared_with_users()
      RETURNS TRIGGER AS $$
      DECLARE
        affected_rows integer;
        error_message text;
      BEGIN
        -- Handle NULL memo_id
        IF NEW.memo_id IS NULL THEN
          RAISE LOG 'update_memo_shared_with_users: memo_id is NULL, skipping update';
          RETURN NEW;
        END IF;

        BEGIN
          -- Update the shared_with_users array for the affected memo
          UPDATE memos
          SET shared_with_users = (
            SELECT COALESCE(array_agg(DISTINCT sm.user_id), '{}'::uuid[])
            FROM memo_spaces ms
            JOIN space_members sm ON ms.space_id = sm.space_id
            WHERE ms.memo_id = NEW.memo_id
          )
          WHERE id = NEW.memo_id;
          
          GET DIAGNOSTICS affected_rows = ROW_COUNT;
          RAISE LOG 'update_memo_shared_with_users: Updated memo %, affected % rows', NEW.memo_id, affected_rows;
          
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
          RAISE LOG 'update_memo_shared_with_users error: %', error_message;
          -- Don't re-raise the exception to avoid breaking functionality
        END;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create function for updating all memos in a space
      CREATE OR REPLACE FUNCTION update_all_memos_for_space()
      RETURNS TRIGGER AS $$
      DECLARE
        affected_rows integer;
        error_message text;
        space_id_value uuid;
      BEGIN
        -- Handle NULL space_id in both NEW and OLD
        IF (TG_OP = 'DELETE' AND OLD.space_id IS NULL) OR 
           (TG_OP IN ('INSERT', 'UPDATE') AND NEW.space_id IS NULL) THEN
          RAISE LOG 'update_all_memos_for_space: space_id is NULL, skipping update';
          RETURN COALESCE(NEW, OLD);
        END IF;
        
        -- Determine which space_id to use
        IF TG_OP = 'DELETE' THEN
          space_id_value := OLD.space_id;
        ELSE
          space_id_value := NEW.space_id;
        END IF;
        
        RAISE LOG 'update_all_memos_for_space: Processing space_id %', space_id_value;
        
        BEGIN
          -- For each memo in the space, update its shared_with_users array
          UPDATE memos m
          SET shared_with_users = (
            SELECT COALESCE(array_agg(DISTINCT sm.user_id), '{}'::uuid[])
            FROM memo_spaces ms
            JOIN space_members sm ON ms.space_id = sm.space_id
            WHERE ms.memo_id = m.id
            AND ms.space_id = space_id_value
          )
          WHERE m.id IN (
            SELECT memo_id FROM memo_spaces WHERE space_id = space_id_value
          );
          
          GET DIAGNOSTICS affected_rows = ROW_COUNT;
          RAISE LOG 'update_all_memos_for_space: Updated memos for space %, affected % rows', 
                  space_id_value, affected_rows;
                  
        EXCEPTION WHEN OTHERS THEN
          GET STACKED DIAGNOSTICS error_message = MESSAGE_TEXT;
          RAISE LOG 'update_all_memos_for_space error: %', error_message;
          -- Don't re-raise the exception to avoid breaking functionality
        END;
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers
      DROP TRIGGER IF EXISTS memo_spaces_insert_update_trigger ON memo_spaces;
      CREATE TRIGGER memo_spaces_insert_update_trigger
      AFTER INSERT OR UPDATE ON memo_spaces
      FOR EACH ROW
      EXECUTE FUNCTION update_memo_shared_with_users();

      DROP TRIGGER IF EXISTS memo_spaces_delete_trigger ON memo_spaces;
      CREATE TRIGGER memo_spaces_delete_trigger
      AFTER DELETE ON memo_spaces
      FOR EACH ROW
      EXECUTE FUNCTION update_memo_shared_with_users();

      DROP TRIGGER IF EXISTS space_members_trigger ON space_members;
      CREATE TRIGGER space_members_trigger
      AFTER INSERT OR UPDATE OR DELETE ON space_members
      FOR EACH ROW
      EXECUTE FUNCTION update_all_memos_for_space();

      -- Create simplified RLS policies
      ALTER TABLE public.memos ENABLE ROW LEVEL SECURITY;
      
      DO $$ 
      BEGIN
          EXECUTE (
              SELECT string_agg('DROP POLICY IF EXISTS "' || policyname || '" ON memos;', ' ')
              FROM pg_policies
              WHERE tablename = 'memos'
          );
      END $$;

      -- Create simplified policies that use the denormalized column
      CREATE POLICY "Users can access own memos" 
      ON memos FOR ALL 
      USING (user_id = auth.uid()::text);

      CREATE POLICY "Users can view shared memos" 
      ON memos FOR SELECT 
      USING (auth.uid()::uuid = ANY(shared_with_users));
      
      -- Add policy for public memos if needed
      CREATE POLICY "Users can view public memos" 
      ON memos FOR SELECT 
      USING (is_public = true);
      `;
      
      // Run the migration SQL
      const { error } = await this.supabase.rpc('run_sql', { sql: createTableSQL });
      
      if (error) throw error;
      
      // Initialize shared_with_users arrays for existing memos
      await this.supabase.rpc('run_sql', { 
        sql: `
        -- Populate the shared_with_users column for all existing memos
        UPDATE memos m
        SET shared_with_users = (
          SELECT COALESCE(array_agg(DISTINCT sm.user_id), '{}'::uuid[])
          FROM memo_spaces ms
          JOIN space_members sm ON ms.space_id = sm.space_id
          WHERE ms.memo_id = m.id
        );
        ` 
      });
      
      this.logger.log('Space members migration completed successfully');
      
      return { success: true, message: 'Space members migration completed successfully' };
    } catch (error) {
      this.logger.error(`Error running space members migration: ${error.message}`, error.stack);
      return { success: false, message: error.message };
    }
  }
}
```

## Key Differences from Original Implementation

1. **Simplified Methods**:
   - Removed any complex recursive RLS policy management
   - Focuses only on CRUD operations for the `space_members` table
   - Leverages database triggers for maintaining the denormalized data

2. **Reduced Complexity**:
   - The service now has a clear, focused purpose: manage space membership data
   - All complex access control logic is now handled at the database level
   - The migration script includes the triggers and denormalized approach

3. **Improved Error Handling**:
   - More robust error handling and logging throughout
   - Better handling of edge cases like missing data
   - Includes NULL checks and logging in database triggers

## Controller Methods

The corresponding controller methods would be simplified as well:

```typescript
@Controller('memoro')
export class SpaceSyncController {
  constructor(private readonly spaceSyncService: SpaceSyncService) {}

  @Post('spaces/:spaceId/sync-members')
  async syncSpaceMembers(@Param('spaceId') spaceId: string) {
    return this.spaceSyncService.syncSpaceMembers(spaceId);
  }

  @Post('users/:userId/sync-spaces')
  async syncUserSpaces(@Param('userId') userId: string) {
    return this.spaceSyncService.syncUserSpaces(userId);
  }

  @Post('run-space-members-migration')
  async runSpaceMembersMigration() {
    return this.spaceSyncService.runSpaceMembersMigration();
  }
}
```

## Integration with MemoroService

The MemoroService would need only minimal integration with the SpaceSyncService:

```typescript
// In MemoroService.ts
async createMemoroSpace(userId: string, spaceName: string, token: string) {
  const space = await this.spacesService.createSpace(userId, spaceName, token);
  // Only need to maintain the space_members table
  await this.spaceSyncService.syncSpaceMembership(space.id, userId, 'owner');
  return space;
}

async inviteUserToSpace(userId: string, spaceId: string, email: string, role: string, token: string) {
  const result = await this.spacesService.addSpaceMember(spaceId, email, role, token);
  if (result.invitee_id) {
    // Only need to maintain the space_members table when a user is invited
    await this.spaceSyncService.syncSpaceMembership(spaceId, result.invitee_id, role, userId);
  }
  return result;
}

async removeUserFromSpace(userId: string, spaceId: string, memberId: string, token: string) {
  const result = await this.spacesService.removeSpaceMember(spaceId, memberId, token);
  // Remove from space_members table
  await this.spaceSyncService.removeSpaceMembership(spaceId, memberId);
  return result;
}
```
