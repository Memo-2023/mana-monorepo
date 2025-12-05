-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for content node kinds
CREATE TYPE node_kind AS ENUM ('world', 'character', 'object', 'place', 'story');

-- Create enum for visibility levels
CREATE TYPE visibility_level AS ENUM ('private', 'shared', 'public');

-- Create enum for story entry types
CREATE TYPE story_entry_type AS ENUM ('narration', 'dialog', 'note');

-- Create content_nodes table
CREATE TABLE content_nodes (
  -- Meta fields
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind node_kind NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility visibility_level DEFAULT 'private',
  tags TEXT[] DEFAULT '{}',
  world_slug TEXT,
  
  -- Content as JSONB
  content JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for foreign key references
  CONSTRAINT fk_world_slug FOREIGN KEY (world_slug) REFERENCES content_nodes(slug) ON DELETE SET NULL
);

-- Create story_entries table
CREATE TABLE story_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_slug TEXT NOT NULL REFERENCES content_nodes(slug) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  type story_entry_type NOT NULL,
  speaker_slug TEXT,
  body TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(story_slug, position)
);

-- Create node_revisions table
CREATE TABLE node_revisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES content_nodes(id) ON DELETE CASCADE,
  node_slug TEXT NOT NULL,
  content_before JSONB,
  content_after JSONB,
  edited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  edited_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Create attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_slug TEXT NOT NULL REFERENCES content_nodes(slug) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'audio', 'doc')),
  url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_nodes_kind ON content_nodes(kind);
CREATE INDEX idx_content_nodes_owner ON content_nodes(owner_id);
CREATE INDEX idx_content_nodes_visibility ON content_nodes(visibility);
CREATE INDEX idx_content_nodes_world ON content_nodes(world_slug);
CREATE INDEX idx_content_nodes_tags ON content_nodes USING GIN(tags);
CREATE INDEX idx_story_entries_story ON story_entries(story_slug);
CREATE INDEX idx_story_entries_speaker ON story_entries(speaker_slug);
CREATE INDEX idx_attachments_node ON attachments(node_slug);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_content_nodes_updated_at 
  BEFORE UPDATE ON content_nodes 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();