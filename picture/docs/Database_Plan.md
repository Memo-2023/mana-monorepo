-- Users Tabelle (erweitert Supabase Auth)
CREATE TABLE profiles (
id UUID REFERENCES auth.users(id) PRIMARY KEY,
username VARCHAR(50) UNIQUE,
email VARCHAR(255),
avatar_url TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Image Generation Requests
CREATE TABLE image_generations (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
prompt TEXT NOT NULL,
negative_prompt TEXT,
model VARCHAR(50) DEFAULT 'stable-diffusion', -- stable-diffusion, dall-e, midjourney
style VARCHAR(50), -- realistic, cartoon, abstract, etc.
width INTEGER DEFAULT 512,
height INTEGER DEFAULT 512,
steps INTEGER DEFAULT 20,
guidance_scale DECIMAL(3,1) DEFAULT 7.5,
seed INTEGER,
status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
error_message TEXT,
generation_time_seconds INTEGER,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
completed_at TIMESTAMP WITH TIME ZONE
);

-- Generated Images
CREATE TABLE images (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
generation_id UUID REFERENCES image_generations(id) ON DELETE CASCADE,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
filename VARCHAR(255) NOT NULL,
storage_path TEXT NOT NULL, -- Supabase Storage Pfad
public_url TEXT,
file_size INTEGER,
width INTEGER,
height INTEGER,
format VARCHAR(10) DEFAULT 'png', -- png, jpg, webp
is_public BOOLEAN DEFAULT false,
is_favorite BOOLEAN DEFAULT false,
rating INTEGER CHECK (rating >= 0 AND rating <= 5), -- 0-5 Sterne Rating
download_count INTEGER DEFAULT 0,
-- Generation-Parameter für einfache Frontend-Anzeige (denormalisiert)
prompt TEXT NOT NULL,
negative_prompt TEXT,
model VARCHAR(50) DEFAULT 'stable-diffusion',
style VARCHAR(50),
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags für Kategorisierung und Suche
CREATE TABLE tags (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
name VARCHAR(50) NOT NULL UNIQUE,
color VARCHAR(7), -- Hex color code für UI, z.B. #FF5733
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Many-to-Many Beziehung zwischen Images und Tags
CREATE TABLE image_tags (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
image_id UUID REFERENCES images(id) ON DELETE CASCADE,
tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(image_id, tag_id)
);

-- Likes/Favorites für Community Features
CREATE TABLE image_likes (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
image_id UUID REFERENCES images(id) ON DELETE CASCADE,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
UNIQUE(user_id, image_id)
);

-- Prompt Templates/Presets
CREATE TABLE prompt_templates (
id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
name VARCHAR(100) NOT NULL,
prompt TEXT NOT NULL,
negative_prompt TEXT,
category VARCHAR(50), -- portrait, landscape, abstract, etc.
is_public BOOLEAN DEFAULT false,
use_count INTEGER DEFAULT 0,
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_images_rating ON images(rating);
CREATE INDEX idx_images_is_public ON images(is_public);
CREATE INDEX idx_image_generations_user_id ON image_generations(user_id);
CREATE INDEX idx_image_generations_status ON image_generations(status);
CREATE INDEX idx_image_generations_created_at ON image_generations(created_at DESC);
CREATE INDEX idx_prompt_templates_user_id ON prompt_templates(user_id);
CREATE INDEX idx_prompt_templates_category ON prompt_templates(category);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX idx_image_tags_tag_id ON image_tags(tag_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

-- Beispiel RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own images" ON images FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own images" ON images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own images" ON images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own images" ON images FOR DELETE USING (auth.uid() = user_id);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = NOW();
RETURN NEW;
END;

$$
language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
$$
