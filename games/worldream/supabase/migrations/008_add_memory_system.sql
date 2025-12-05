-- Migration: Add Memory System for All Content Nodes
-- Description: Adds a separate memory JSONB column for all node types and skills JSONB column for characters

-- Add memory column to content_nodes
ALTER TABLE content_nodes 
ADD COLUMN IF NOT EXISTS memory JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT NULL;

-- Add indexes for memory queries
CREATE INDEX IF NOT EXISTS idx_content_nodes_memory 
ON content_nodes USING GIN (memory);

CREATE INDEX IF NOT EXISTS idx_content_nodes_skills 
ON content_nodes USING GIN (skills);

-- Add partial index for nodes with memory
CREATE INDEX IF NOT EXISTS idx_content_nodes_with_memory 
ON content_nodes (id) 
WHERE memory IS NOT NULL;

-- Create memory_events table for story integration
CREATE TABLE IF NOT EXISTS memory_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id UUID REFERENCES content_nodes(id) ON DELETE CASCADE,
  story_id UUID REFERENCES content_nodes(id) ON DELETE SET NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN ('observed', 'experienced', 'told', 'dreamed', 'remembered')),
  raw_event TEXT NOT NULL,
  processed_memory JSONB,
  memory_tier TEXT CHECK (memory_tier IN ('short', 'medium', 'long')),
  importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for memory_events
CREATE INDEX IF NOT EXISTS idx_memory_events_node 
ON memory_events(node_id);

CREATE INDEX IF NOT EXISTS idx_memory_events_story 
ON memory_events(story_id);

CREATE INDEX IF NOT EXISTS idx_memory_events_timestamp 
ON memory_events(event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_memory_events_importance 
ON memory_events(importance DESC);

-- Add RLS policies for memory_events
ALTER TABLE memory_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view memory events for their own nodes
CREATE POLICY "Users can view own node memories" ON memory_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_nodes 
      WHERE content_nodes.id = memory_events.node_id 
      AND content_nodes.owner_id = auth.uid()
    )
  );

-- Policy: Users can create memory events for their own nodes
CREATE POLICY "Users can create own node memories" ON memory_events
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM content_nodes 
      WHERE content_nodes.id = node_id 
      AND content_nodes.owner_id = auth.uid()
    )
  );

-- Policy: Users can update their own node memories
CREATE POLICY "Users can update own node memories" ON memory_events
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM content_nodes 
      WHERE content_nodes.id = memory_events.node_id 
      AND content_nodes.owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their own node memories
CREATE POLICY "Users can delete own node memories" ON memory_events
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM content_nodes 
      WHERE content_nodes.id = memory_events.node_id 
      AND content_nodes.owner_id = auth.uid()
    )
  );

-- Function to process and age memories
CREATE OR REPLACE FUNCTION process_node_memories(
  p_node_id UUID,
  p_current_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_memory JSONB;
  v_short_term JSONB;
  v_medium_term JSONB;
  v_long_term JSONB;
  v_aged_memories JSONB[];
  v_memory_item JSONB;
BEGIN
  -- Get current memory
  SELECT memory INTO v_memory 
  FROM content_nodes 
  WHERE id = p_node_id;
  
  IF v_memory IS NULL THEN
    v_memory := '{
      "short_term_memory": [],
      "medium_term_memory": [],
      "long_term_memory": [],
      "memory_traits": {
        "memory_quality": "average"
      }
    }'::JSONB;
  END IF;
  
  -- Process short-term memories (older than 3 days -> medium-term)
  v_short_term := COALESCE(v_memory->'short_term_memory', '[]'::JSONB);
  v_medium_term := COALESCE(v_memory->'medium_term_memory', '[]'::JSONB);
  v_long_term := COALESCE(v_memory->'long_term_memory', '[]'::JSONB);
  
  -- Age short-term memories
  v_aged_memories := ARRAY[]::JSONB[];
  FOR v_memory_item IN SELECT * FROM jsonb_array_elements(v_short_term)
  LOOP
    IF (v_memory_item->>'timestamp')::TIMESTAMPTZ < p_current_date - INTERVAL '3 days' THEN
      -- Move to medium-term if important enough
      IF (v_memory_item->>'importance')::INT >= 3 THEN
        v_medium_term := v_medium_term || jsonb_build_object(
          'id', v_memory_item->>'id',
          'timestamp', v_memory_item->>'timestamp',
          'content', v_memory_item->>'content',
          'context', 'Moved from short-term memory',
          'importance', v_memory_item->>'importance',
          'decay_at', (p_current_date + INTERVAL '3 months')::TEXT,
          'involved', v_memory_item->'involved',
          'tags', v_memory_item->'tags'
        );
      END IF;
    ELSE
      v_aged_memories := v_aged_memories || v_memory_item;
    END IF;
  END LOOP;
  
  -- Update memory object
  v_memory := jsonb_build_object(
    'short_term_memory', to_jsonb(v_aged_memories),
    'medium_term_memory', v_medium_term,
    'long_term_memory', v_long_term,
    'memory_traits', COALESCE(v_memory->'memory_traits', '{"memory_quality": "average"}'::JSONB),
    'last_processed', p_current_date
  );
  
  -- Update the node's memory
  UPDATE content_nodes 
  SET memory = v_memory,
      updated_at = NOW()
  WHERE id = p_node_id;
  
  RETURN v_memory;
END;
$$;

-- Function to add a memory to a node
CREATE OR REPLACE FUNCTION add_node_memory(
  p_node_id UUID,
  p_content TEXT,
  p_tier TEXT DEFAULT 'short',
  p_importance INT DEFAULT 5,
  p_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_involved TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_memory JSONB;
  v_new_memory JSONB;
  v_tier_key TEXT;
BEGIN
  -- Validate tier
  IF p_tier NOT IN ('short', 'medium', 'long') THEN
    RAISE EXCEPTION 'Invalid memory tier: %', p_tier;
  END IF;
  
  -- Build tier key
  v_tier_key := p_tier || '_term_memory';
  
  -- Get current memory
  SELECT memory INTO v_memory 
  FROM content_nodes 
  WHERE id = p_node_id;
  
  IF v_memory IS NULL THEN
    v_memory := jsonb_build_object(
      'short_term_memory', '[]'::JSONB,
      'medium_term_memory', '[]'::JSONB,
      'long_term_memory', '[]'::JSONB,
      'memory_traits', jsonb_build_object('memory_quality', 'average')
    );
  END IF;
  
  -- Create new memory entry
  v_new_memory := jsonb_build_object(
    'id', gen_random_uuid()::TEXT,
    'timestamp', NOW()::TEXT,
    'content', p_content,
    'importance', p_importance,
    'tags', to_jsonb(p_tags),
    'involved', to_jsonb(p_involved)
  );
  
  -- Add tier-specific fields
  IF p_tier = 'short' THEN
    v_new_memory := v_new_memory || jsonb_build_object(
      'decay_at', (NOW() + INTERVAL '3 days')::TEXT
    );
  ELSIF p_tier = 'medium' THEN
    v_new_memory := v_new_memory || jsonb_build_object(
      'decay_at', (NOW() + INTERVAL '3 months')::TEXT,
      'context', 'Manually added'
    );
  ELSIF p_tier = 'long' THEN
    v_new_memory := v_new_memory || jsonb_build_object(
      'emotional_weight', p_importance,
      'category', 'manual',
      'immutable', true
    );
  END IF;
  
  -- Add memory to appropriate tier
  v_memory := jsonb_set(
    v_memory,
    ARRAY[v_tier_key],
    COALESCE(v_memory->v_tier_key, '[]'::JSONB) || v_new_memory
  );
  
  -- Update the node's memory
  UPDATE content_nodes 
  SET memory = v_memory,
      updated_at = NOW()
  WHERE id = p_node_id;
  
  RETURN v_new_memory;
END;
$$;

-- Add comment explaining the structure
COMMENT ON COLUMN content_nodes.memory IS 'Memory system with three tiers: short_term (1-3 days), medium_term (1 week - 3 months), long_term (permanent) - available for all node types';
COMMENT ON COLUMN content_nodes.skills IS 'Skills and abilities including primary skills, learning progress, and conditional modifiers - primarily for characters but available for all node types';