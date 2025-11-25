/**
 * Space Service - CRUD operations via Supabase
 */

import { createSupabaseBrowserClient } from './supabase';
import type { Space, SpaceMember, SpaceCreate, SpaceUpdate } from '@chat/types';

let supabase: ReturnType<typeof createSupabaseBrowserClient> | null = null;

function getSupabase() {
  if (!supabase) {
    supabase = createSupabaseBrowserClient();
  }
  return supabase;
}

export const spaceService = {
  /**
   * Get all spaces for a user (both owned and member of)
   */
  async getUserSpaces(userId: string): Promise<Space[]> {
    const sb = getSupabase();

    // Get space IDs the user is a member of (with accepted status)
    const { data: memberData, error: memberError } = await sb
      .from('space_members')
      .select('space_id')
      .eq('user_id', userId)
      .eq('invitation_status', 'accepted');

    if (memberError) {
      console.error('Error fetching user space memberships:', memberError);
      return [];
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    const spaceIds = memberData.map((m) => m.space_id);

    // Fetch the actual space data
    const { data: spaces, error: spacesError } = await sb
      .from('spaces')
      .select('*')
      .in('id', spaceIds)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (spacesError) {
      console.error('Error fetching spaces:', spacesError);
      return [];
    }

    return spaces as Space[];
  },

  /**
   * Get a single space by ID
   */
  async getSpace(spaceId: string): Promise<Space | null> {
    const sb = getSupabase();

    const { data, error } = await sb.from('spaces').select('*').eq('id', spaceId).single();

    if (error) {
      console.error('Error fetching space:', error);
      return null;
    }

    return data as Space;
  },

  /**
   * Create a new space
   */
  async createSpace(space: SpaceCreate): Promise<string | null> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('spaces')
      .insert({
        name: space.name,
        description: space.description,
        owner_id: space.owner_id,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating space:', error);
      return null;
    }

    return data.id;
  },

  /**
   * Update a space
   */
  async updateSpace(spaceId: string, updates: SpaceUpdate): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb.from('spaces').update(updates).eq('id', spaceId);

    if (error) {
      console.error('Error updating space:', error);
      return false;
    }

    return true;
  },

  /**
   * Delete a space
   */
  async deleteSpace(spaceId: string): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb.from('spaces').delete().eq('id', spaceId);

    if (error) {
      console.error('Error deleting space:', error);
      return false;
    }

    return true;
  },

  /**
   * Get members of a space
   */
  async getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
    const sb = getSupabase();

    const { data, error } = await sb
      .from('space_members')
      .select('*')
      .eq('space_id', spaceId)
      .order('role', { ascending: true })
      .order('joined_at', { ascending: false });

    if (error) {
      console.error('Error fetching space members:', error);
      return [];
    }

    return data as SpaceMember[];
  },

  /**
   * Get user's role in a space
   */
  async getUserRoleInSpace(
    spaceId: string,
    userId: string
  ): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
    const sb = getSupabase();

    // First check if they're the owner
    const { data: space, error: spaceError } = await sb
      .from('spaces')
      .select('owner_id')
      .eq('id', spaceId)
      .single();

    if (spaceError) {
      console.error('Error checking space ownership:', spaceError);
      return null;
    }

    if (space.owner_id === userId) {
      return 'owner';
    }

    // If not owner, check membership
    const { data: member, error: memberError } = await sb
      .from('space_members')
      .select('role, invitation_status')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (memberError) {
      return null;
    }

    if (member && member.invitation_status === 'accepted') {
      return member.role as 'admin' | 'member' | 'viewer';
    }

    return null;
  },

  /**
   * Leave a space
   */
  async leaveSpace(spaceId: string, userId: string): Promise<boolean> {
    const sb = getSupabase();

    const { error } = await sb
      .from('space_members')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error leaving space:', error);
      return false;
    }

    return true;
  },
};
