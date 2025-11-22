-- Create character_collections table
CREATE TABLE IF NOT EXISTS character_collections (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'custom',
  is_official BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 999,
  icon_url TEXT,
  banner_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_by UUID,
  
  -- Constraint for type values
  CONSTRAINT valid_collection_type CHECK (type IN ('official', 'community', 'seasonal', 'custom'))
);

-- Create collection_characters junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS collection_characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id VARCHAR(50) NOT NULL,
  character_id UUID NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  added_by UUID,
  
  -- Ensure unique character per collection
  UNIQUE(collection_id, character_id),
  
  -- Foreign keys
  CONSTRAINT fk_collection
    FOREIGN KEY(collection_id) 
    REFERENCES character_collections(id)
    ON DELETE CASCADE,
  
  CONSTRAINT fk_character
    FOREIGN KEY(character_id) 
    REFERENCES characters(id)
    ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_character_collections_type ON character_collections(type);
CREATE INDEX idx_character_collections_is_active ON character_collections(is_active);
CREATE INDEX idx_character_collections_sort_order ON character_collections(sort_order);
CREATE INDEX idx_collection_characters_collection_id ON collection_characters(collection_id);
CREATE INDEX idx_collection_characters_character_id ON collection_characters(character_id);

-- Enable Row Level Security
ALTER TABLE character_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for character_collections
-- Policy: Everyone can view active collections
CREATE POLICY "View active collections" ON character_collections
  FOR SELECT
  USING (is_active = true);

-- Policy: Only admins can insert collections (you may need to adjust this based on your admin logic)
CREATE POLICY "Admins can create collections" ON character_collections
  FOR INSERT
  WITH CHECK (is_official = false OR auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can update collections
CREATE POLICY "Admins can update collections" ON character_collections
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Policy: Only admins can delete collections  
CREATE POLICY "Admins can delete collections" ON character_collections
  FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for collection_characters
-- Policy: Everyone can view collection characters
CREATE POLICY "View collection characters" ON collection_characters
  FOR SELECT
  USING (true);

-- Policy: Only admins can manage collection characters
CREATE POLICY "Admins can manage collection characters" ON collection_characters
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert default collections
INSERT INTO character_collections (id, name, description, type, is_official, is_active, sort_order)
VALUES 
  ('official', 'Offizielle Charaktere', 'Von Märchenzauber erstellte Charaktere', 'official', true, true, 1),
  ('community', 'Community Lieblinge', 'Die beliebtesten Charaktere der Community', 'community', false, true, 2),
  ('seasonal', 'Saisonale Charaktere', 'Charaktere für besondere Anlässe', 'seasonal', false, true, 3)
ON CONFLICT (id) DO NOTHING;

-- Create trigger to auto-update updated_at for character_collections
CREATE TRIGGER update_character_collections_updated_at BEFORE UPDATE
  ON character_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();