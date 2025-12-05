-- Add generation fields to content_nodes
ALTER TABLE content_nodes
ADD COLUMN generation_prompt TEXT,
ADD COLUMN generation_model TEXT,
ADD COLUMN generation_date TIMESTAMP WITH TIME ZONE;

-- Create prompt_templates table
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  world_slug TEXT REFERENCES content_nodes(slug) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('world', 'character', 'place', 'object', 'story')),
  title TEXT NOT NULL,
  prompt_template TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_template_title_per_user UNIQUE(owner_id, title)
);

-- Create prompt_history table
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response JSONB,
  model TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_prompt_templates_owner ON prompt_templates(owner_id);
CREATE INDEX idx_prompt_templates_world ON prompt_templates(world_slug);
CREATE INDEX idx_prompt_templates_kind ON prompt_templates(kind);
CREATE INDEX idx_prompt_templates_public ON prompt_templates(is_public) WHERE is_public = true;
CREATE INDEX idx_prompt_history_user ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_node ON prompt_history(node_id);

-- Add RLS policies for prompt_templates
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own templates" ON prompt_templates
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view public templates" ON prompt_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own templates" ON prompt_templates
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own templates" ON prompt_templates
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own templates" ON prompt_templates
  FOR DELETE USING (auth.uid() = owner_id);

-- Add RLS policies for prompt_history
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prompt history" ON prompt_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompt history" ON prompt_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_template_usage(template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE prompt_templates 
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = template_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add some default prompt templates
INSERT INTO prompt_templates (owner_id, kind, title, prompt_template, description, tags, is_public) VALUES
(NULL, 'character', 'Mysteriöser Händler', 'Erstelle einen mysteriösen Händler für die Welt {world_name}. Er sollte seltene und ungewöhnliche Gegenstände verkaufen und ein dunkles Geheimnis haben. Fokussiere dich auf: zwielichtiges Aussehen, versteckte Motive, einzigartige Waren, und eine interessante Hintergrundgeschichte.', 'Vorlage für einen zwielichtigen Händler-Charakter', ARRAY['händler', 'mysteriös', 'npc'], true),
(NULL, 'character', 'Weiser Mentor', 'Erschaffe einen weisen Mentor-Charakter für {world_name}. Diese Person sollte umfangreiches Wissen besitzen, aber auch eigene Schwächen haben. Beschreibe: Aussehen, Weisheit, Lehrmethoden, vergangene Fehler, und was sie antreibt.', 'Vorlage für einen Mentor-Charakter', ARRAY['mentor', 'weise', 'lehrer'], true),
(NULL, 'place', 'Vergessener Ort', 'Generiere einen verlassenen, vergessenen Ort in {world_name}. Der Ort war einst wichtig und belebt, ist aber nun verfallen. Beschreibe: die frühere Pracht, den aktuellen Verfall, verborgene Schätze oder Geheimnisse, und warum er verlassen wurde.', 'Vorlage für einen verlassenen Ort', ARRAY['verlassen', 'ruine', 'geheimnisvoll'], true),
(NULL, 'place', 'Geschäftiger Marktplatz', 'Erstelle einen lebhaften Marktplatz in {world_name}. Er sollte voller Leben, Farben und Gerüche sein. Beschreibe: die verschiedenen Stände, typische Besucher, besondere Waren, versteckte Ecken, und die Atmosphäre zu verschiedenen Tageszeiten.', 'Vorlage für einen Marktplatz', ARRAY['markt', 'handel', 'belebt'], true),
(NULL, 'object', 'Verfluchtes Artefakt', 'Erschaffe ein verfluchtes Artefakt für {world_name}. Es sollte mächtig aber gefährlich sein. Beschreibe: Aussehen, Geschichte, Kräfte, Fluch, und wie man es finden oder zerstören kann.', 'Vorlage für ein verfluchtes Objekt', ARRAY['artefakt', 'verflucht', 'mächtig'], true),
(NULL, 'object', 'Alltäglicher Zaubergegenstand', 'Erstelle einen alltäglichen magischen Gegenstand für {world_name}. Etwas Nützliches aber nicht Übermächtiges. Beschreibe: Aussehen, Funktion, Herstellung, Einschränkungen, und wer es typischerweise benutzt.', 'Vorlage für einen einfachen magischen Gegenstand', ARRAY['magie', 'alltäglich', 'nützlich'], true),
(NULL, 'story', 'Heldenreise', 'Entwickle eine Heldenreise-Geschichte in {world_name}. Der Protagonist sollte vor einer großen Herausforderung stehen. Plane: den Ruf zum Abenteuer, Mentoren und Gefährten, Prüfungen, die Transformation, und die Rückkehr.', 'Klassische Heldenreise-Struktur', ARRAY['heldenreise', 'abenteuer', 'quest'], true),
(NULL, 'world', 'Fantasy-Königreich', 'Erschaffe ein Fantasy-Königreich mit eigener Geschichte und Kultur. Beschreibe: Geographie, Regierungssystem, Kultur und Bräuche, Magie-System, wichtige Orte, aktuelle Konflikte, und die Rolle von Helden.', 'Vorlage für eine klassische Fantasy-Welt', ARRAY['fantasy', 'königreich', 'magie'], true);