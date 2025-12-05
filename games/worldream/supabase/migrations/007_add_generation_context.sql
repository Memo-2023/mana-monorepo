-- Add generation_context JSONB field to content_nodes table
-- This will store the complete LLM input context for transparency and debugging

ALTER TABLE content_nodes 
ADD COLUMN generation_context JSONB DEFAULT NULL;

-- Add index for JSONB queries on generation_context
CREATE INDEX idx_content_nodes_generation_context 
ON content_nodes USING GIN (generation_context);

-- Add comment for documentation
COMMENT ON COLUMN content_nodes.generation_context IS 
'Complete LLM generation context including user prompt, system prompt, character context, and world context';