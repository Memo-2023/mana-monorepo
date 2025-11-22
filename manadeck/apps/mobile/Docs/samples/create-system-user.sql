-- Create System User for Sample Decks
-- This script creates a system user that can be used for sample/public decks

-- Insert system user into auth.users table
INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'system@manadeck.app',
    '$2a$10$dummyhashforpassword',  -- Dummy encrypted password
    now(),
    '{"provider": "system", "providers": ["system"]}',
    '{"display_name": "Manadeck System", "is_system_user": true}',
    now(),
    now(),
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;  -- Don't fail if user already exists

-- Create corresponding profile for the system user
INSERT INTO public.profiles (
    id,
    username,
    display_name,
    bio,
    preferences,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'manadeck_system',
    'Manadeck System',
    'System account for managing public sample decks and community content.',
    '{"is_system_account": true, "can_create_public_decks": true}',
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Verify the system user was created
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at IS NOT NULL as email_confirmed,
    p.username,
    p.display_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.id = '00000000-0000-0000-0000-000000000001';