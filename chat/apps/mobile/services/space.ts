import { supabase } from '../utils/supabase';

// Type definitions for spaces and members
export type Space = {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
};

export type SpaceMember = {
  id: string;
  space_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  invitation_status: 'pending' | 'accepted' | 'declined';
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  created_at: string;
  updated_at: string;
};

// Get all spaces for a user (both owned and member of)
export async function getUserSpaces(userId: string): Promise<Space[]> {
  try {
    const { data: memberData, error: memberError } = await supabase
      .from('space_members')
      .select(`
        space_id,
        role,
        invitation_status
      `)
      .eq('user_id', userId)
      .eq('invitation_status', 'accepted');

    if (memberError) {
      console.error('Error fetching user space memberships:', memberError);
      return [];
    }

    if (!memberData || memberData.length === 0) {
      return [];
    }

    // Get space IDs the user is a member of
    const spaceIds = memberData.map(m => m.space_id);

    // Fetch the actual space data
    const { data: spaces, error: spacesError } = await supabase
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
  } catch (error) {
    console.error('Error in getUserSpaces:', error);
    return [];
  }
}

// Get spaces the user owns
export async function getOwnedSpaces(userId: string): Promise<Space[]> {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('owner_id', userId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching owned spaces:', error);
      return [];
    }

    return data as Space[];
  } catch (error) {
    console.error('Error in getOwnedSpaces:', error);
    return [];
  }
}

// Get a single space by ID
export async function getSpace(spaceId: string): Promise<Space | null> {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single();

    if (error) {
      console.error('Error fetching space:', error);
      return null;
    }

    return data as Space;
  } catch (error) {
    console.error('Error in getSpace:', error);
    return null;
  }
}

// Create a new space
export async function createSpace(
  userId: string,
  name: string,
  description?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('spaces')
      .insert({
        name,
        description,
        owner_id: userId
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating space:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createSpace:', error);
    return null;
  }
}

// Update a space
export async function updateSpace(
  spaceId: string,
  updates: { name?: string; description?: string; is_archived?: boolean }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('spaces')
      .update(updates)
      .eq('id', spaceId);

    if (error) {
      console.error('Error updating space:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSpace:', error);
    return false;
  }
}

// Delete a space
export async function deleteSpace(spaceId: string): Promise<boolean> {
  try {
    // Delete the space (members will be cascade deleted due to foreign key constraint)
    const { error } = await supabase
      .from('spaces')
      .delete()
      .eq('id', spaceId);

    if (error) {
      console.error('Error deleting space:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteSpace:', error);
    return false;
  }
}

// Get members of a space
export async function getSpaceMembers(spaceId: string): Promise<SpaceMember[]> {
  try {
    const { data, error } = await supabase
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
  } catch (error) {
    console.error('Error in getSpaceMembers:', error);
    return [];
  }
}

// Add a member to a space
export async function inviteUserToSpace(
  spaceId: string,
  userId: string,
  invitedByUserId: string,
  role: 'admin' | 'member' | 'viewer' = 'member'
): Promise<boolean> {
  try {
    // Check if user is already a member
    const { data: existingMember, error: checkError } = await supabase
      .from('space_members')
      .select('id, invitation_status')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing membership:', checkError);
      return false;
    }

    // If already a member with accepted status, just return true
    if (existingMember && existingMember.invitation_status === 'accepted') {
      return true;
    }

    // If there's a pending or declined invitation, update it
    if (existingMember) {
      const { error: updateError } = await supabase
        .from('space_members')
        .update({
          role,
          invitation_status: 'pending',
          invited_by: invitedByUserId,
          invited_at: new Date().toISOString()
        })
        .eq('id', existingMember.id);

      if (updateError) {
        console.error('Error updating invitation:', updateError);
        return false;
      }

      return true;
    }

    // Otherwise, create a new invitation
    const { error: insertError } = await supabase
      .from('space_members')
      .insert({
        space_id: spaceId,
        user_id: userId,
        role,
        invited_by: invitedByUserId,
        invitation_status: 'pending'
      });

    if (insertError) {
      console.error('Error inviting user to space:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in inviteUserToSpace:', error);
    return false;
  }
}

// Accept or decline a space invitation
export async function respondToInvitation(
  spaceId: string,
  userId: string,
  status: 'accepted' | 'declined'
): Promise<boolean> {
  try {
    const updates: any = {
      invitation_status: status
    };

    // If accepting, set the joined_at timestamp
    if (status === 'accepted') {
      updates.joined_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('space_members')
      .update(updates)
      .eq('space_id', spaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error responding to invitation:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in respondToInvitation:', error);
    return false;
  }
}

// Remove a member from a space
export async function removeMember(spaceId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('space_members')
      .delete()
      .eq('space_id', spaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeMember:', error);
    return false;
  }
}

// Change a member's role
export async function changeMemberRole(
  spaceId: string,
  userId: string,
  newRole: 'admin' | 'member' | 'viewer'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('space_members')
      .update({ role: newRole })
      .eq('space_id', spaceId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error changing member role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in changeMemberRole:', error);
    return false;
  }
}

// Get user's role in a space
export async function getUserRoleInSpace(
  spaceId: string,
  userId: string
): Promise<'owner' | 'admin' | 'member' | 'viewer' | null> {
  try {
    // First check if they're the owner
    const { data: space, error: spaceError } = await supabase
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
    const { data: member, error: memberError } = await supabase
      .from('space_members')
      .select('role, invitation_status')
      .eq('space_id', spaceId)
      .eq('user_id', userId)
      .single();

    if (memberError) {
      // This could mean they're not a member, which is fine
      return null;
    }

    // Only return role if invitation is accepted
    if (member && member.invitation_status === 'accepted') {
      return member.role as 'admin' | 'member' | 'viewer';
    }

    return null;
  } catch (error) {
    console.error('Error in getUserRoleInSpace:', error);
    return null;
  }
}

// Get pending space invitations for a user
export async function getPendingInvitations(userId: string): Promise<Array<{
  invitation: SpaceMember;
  space: Space;
}>> {
  try {
    const { data, error } = await supabase
      .from('space_members')
      .select(`
        *,
        space:space_id (*)
      `)
      .eq('user_id', userId)
      .eq('invitation_status', 'pending');

    if (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }

    return data.map(item => ({
      invitation: {
        id: item.id,
        space_id: item.space_id,
        user_id: item.user_id,
        role: item.role,
        invitation_status: item.invitation_status,
        invited_by: item.invited_by,
        invited_at: item.invited_at,
        joined_at: item.joined_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      },
      space: item.space
    }));
  } catch (error) {
    console.error('Error in getPendingInvitations:', error);
    return [];
  }
}