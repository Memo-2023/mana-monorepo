-- Create updated_at trigger for spaces
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to spaces table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_spaces_updated_at'
  ) THEN
    CREATE TRIGGER set_spaces_updated_at
    BEFORE UPDATE ON public.spaces
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Apply updated_at trigger to space_members table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_space_members_updated_at'
  ) THEN
    CREATE TRIGGER set_space_members_updated_at
    BEFORE UPDATE ON public.space_members
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
  END IF;
END
$$;

-- Automatically add space owner as member with owner role
CREATE OR REPLACE FUNCTION add_owner_to_space_members()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.space_members (
    space_id, 
    user_id, 
    role, 
    invitation_status,
    joined_at
  )
  VALUES (
    NEW.id, 
    NEW.owner_id, 
    'owner', 
    'accepted',
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply owner trigger to spaces table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'add_owner_to_space_members_trigger'
  ) THEN
    CREATE TRIGGER add_owner_to_space_members_trigger
    AFTER INSERT ON public.spaces
    FOR EACH ROW
    EXECUTE FUNCTION add_owner_to_space_members();
  END IF;
END
$$;

-- Update space modification timestamp when members are added/changed
CREATE OR REPLACE FUNCTION update_space_timestamp_on_member_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.spaces
  SET updated_at = NOW()
  WHERE id = NEW.space_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply space timestamp update trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_space_timestamp_trigger'
  ) THEN
    CREATE TRIGGER update_space_timestamp_trigger
    AFTER INSERT OR UPDATE ON public.space_members
    FOR EACH ROW
    EXECUTE FUNCTION update_space_timestamp_on_member_change();
  END IF;
END
$$;