-- Funktion zum Finden eines Benutzers anhand seiner E-Mail-Adresse
CREATE OR REPLACE FUNCTION public.find_user_by_email(email_to_find TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT au.id, au.email::text
  FROM auth.users au
  WHERE au.email ILIKE email_to_find;
END;
$$;

-- Gewähre Zugriffsrechte für die Funktion
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_email(TEXT) TO service_role;
