-- Create user_settings table for storing user-specific settings
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL UNIQUE,
    image_model TEXT DEFAULT 'flux-schnell' CHECK (image_model IN ('flux-schnell', 'flux-pro', 'sdxl')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own settings
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT
    USING (user_id = current_user_id());

-- Policy: Users can insert their own settings
CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT
    WITH CHECK (user_id = current_user_id());

-- Policy: Users can update their own settings
CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE
    USING (user_id = current_user_id())
    WITH CHECK (user_id = current_user_id());

-- Policy: Users can delete their own settings
CREATE POLICY "Users can delete own settings" ON user_settings
    FOR DELETE
    USING (user_id = current_user_id());

-- Insert default settings for existing users (optional)
-- This can be run separately if needed
-- INSERT INTO user_settings (user_id, image_model)
-- SELECT DISTINCT user_id, 'flux-schnell' 
-- FROM stories
-- ON CONFLICT (user_id) DO NOTHING;

COMMENT ON TABLE user_settings IS 'User-specific settings including image generation model preferences';
COMMENT ON COLUMN user_settings.image_model IS 'Selected image generation model: flux-schnell (fast), flux-pro (high quality), sdxl (stable)';