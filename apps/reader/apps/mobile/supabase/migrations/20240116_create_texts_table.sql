-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Die einzige Tabelle die du brauchst
CREATE TABLE texts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Der eigentliche Content
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  
  -- ALLES andere in einem JSONB Feld
  data JSONB DEFAULT '{}' NOT NULL,
  
  -- Nur die absolut nötigen Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX idx_texts_user ON texts(user_id);
CREATE INDEX idx_texts_data ON texts USING GIN (data);

-- RLS aktivieren
ALTER TABLE texts ENABLE ROW LEVEL SECURITY;

-- Jeder sieht nur seine eigenen Texte
CREATE POLICY "Own texts only" ON texts
  FOR ALL USING (auth.uid() = user_id);

-- Update Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_texts_updated_at
  BEFORE UPDATE ON texts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Hilfsfunktion für atomare Play Count Updates
CREATE OR REPLACE FUNCTION increment_play_count(text_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE texts
  SET data = jsonb_set(
    jsonb_set(
      data,
      '{stats,playCount}',
      to_jsonb(COALESCE((data->'stats'->>'playCount')::int, 0) + 1)
    ),
    '{tts,lastPlayed}',
    to_jsonb(NOW())
  )
  WHERE id = text_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;