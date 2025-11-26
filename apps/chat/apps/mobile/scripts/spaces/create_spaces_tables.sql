-- Create spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT false
);

-- Add comments for documentation
COMMENT ON TABLE public.spaces IS 'Collaborative spaces for organizing conversations';
COMMENT ON COLUMN spaces.name IS 'Name of the space';
COMMENT ON COLUMN spaces.description IS 'Optional description of the space';
COMMENT ON COLUMN spaces.owner_id IS 'User ID of the space owner';
COMMENT ON COLUMN spaces.is_archived IS 'Indicates whether the space is archived';

-- Create space_members table with roles/permissions
CREATE TABLE IF NOT EXISTS public.space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invitation_status TEXT NOT NULL DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- Add comments for space_members
COMMENT ON TABLE public.space_members IS 'Members of collaborative spaces with defined roles';
COMMENT ON COLUMN space_members.role IS 'Role of the user in the space (owner, admin, member, viewer)';
COMMENT ON COLUMN space_members.invitation_status IS 'Status of the invitation (pending, accepted, declined)';

-- Modify conversations table to add space_id
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS space_id UUID REFERENCES public.spaces(id) ON DELETE SET NULL;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_space_id ON conversations(space_id);
CREATE INDEX IF NOT EXISTS idx_conversations_space_user ON conversations(space_id, user_id);