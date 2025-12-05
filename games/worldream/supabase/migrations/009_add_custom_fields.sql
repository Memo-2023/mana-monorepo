-- Migration: Add Custom Fields System
-- Description: Adds custom schema and data fields to content_nodes for flexible user-defined mechanics

-- Add custom fields columns to content_nodes
ALTER TABLE content_nodes 
ADD COLUMN IF NOT EXISTS custom_schema JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS schema_version INTEGER DEFAULT 1;

-- Add indexes for custom fields queries
CREATE INDEX IF NOT EXISTS idx_content_nodes_custom_schema 
ON content_nodes USING GIN (custom_schema);

CREATE INDEX IF NOT EXISTS idx_content_nodes_custom_data 
ON content_nodes USING GIN (custom_data);

-- Add partial index for nodes with custom fields
CREATE INDEX IF NOT EXISTS idx_content_nodes_with_custom_fields 
ON content_nodes (id) 
WHERE custom_schema IS NOT NULL;

-- Create custom field templates table
CREATE TABLE IF NOT EXISTS custom_field_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT DEFAULT 'community' CHECK (category IN ('official', 'community', 'personal')),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  applicable_to TEXT[] DEFAULT ARRAY[]::TEXT[], -- node kinds this template applies to
  fields JSONB NOT NULL, -- array of field definitions
  example_data JSONB,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  world_slug TEXT,
  version TEXT DEFAULT '1.0.0',
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[], -- other template slugs
  usage_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for templates
CREATE INDEX IF NOT EXISTS idx_custom_field_templates_slug 
ON custom_field_templates(slug);

CREATE INDEX IF NOT EXISTS idx_custom_field_templates_category 
ON custom_field_templates(category);

CREATE INDEX IF NOT EXISTS idx_custom_field_templates_public 
ON custom_field_templates(is_public) 
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_custom_field_templates_author 
ON custom_field_templates(author_id);

CREATE INDEX IF NOT EXISTS idx_custom_field_templates_world 
ON custom_field_templates(world_slug);

-- Add RLS policies for custom_field_templates
ALTER TABLE custom_field_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view public templates
CREATE POLICY "Public templates are viewable by all" ON custom_field_templates
  FOR SELECT
  USING (is_public = true);

-- Policy: Users can view their own templates
CREATE POLICY "Users can view own templates" ON custom_field_templates
  FOR SELECT
  USING (author_id = auth.uid());

-- Policy: Users can view templates from their worlds
CREATE POLICY "Users can view world templates" ON custom_field_templates
  FOR SELECT
  USING (
    world_slug IN (
      SELECT slug FROM content_nodes 
      WHERE kind = 'world' 
      AND owner_id = auth.uid()
    )
  );

-- Policy: Users can create templates
CREATE POLICY "Users can create templates" ON custom_field_templates
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Policy: Users can update their own templates
CREATE POLICY "Users can update own templates" ON custom_field_templates
  FOR UPDATE
  USING (author_id = auth.uid());

-- Policy: Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON custom_field_templates
  FOR DELETE
  USING (author_id = auth.uid());

-- Function to validate custom schema
CREATE OR REPLACE FUNCTION validate_custom_schema(
  p_schema JSONB
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_field JSONB;
  v_field_type TEXT;
  v_valid_types TEXT[] := ARRAY['text', 'number', 'range', 'select', 'multiselect', 'boolean', 'date', 'formula', 'reference', 'list', 'json'];
BEGIN
  -- Check if schema has required structure
  IF p_schema IS NULL OR NOT p_schema ? 'fields' THEN
    RETURN FALSE;
  END IF;
  
  -- Validate each field
  FOR v_field IN SELECT * FROM jsonb_array_elements(p_schema->'fields')
  LOOP
    -- Check required field properties
    IF NOT (v_field ? 'id' AND v_field ? 'key' AND v_field ? 'label' AND v_field ? 'type') THEN
      RETURN FALSE;
    END IF;
    
    -- Validate field type
    v_field_type := v_field->>'type';
    IF NOT (v_field_type = ANY(v_valid_types)) THEN
      RETURN FALSE;
    END IF;
    
    -- Validate type-specific config
    CASE v_field_type
      WHEN 'number', 'range' THEN
        -- Should have min/max if specified
        IF v_field->'config' ? 'min' AND v_field->'config' ? 'max' THEN
          IF (v_field->'config'->>'min')::NUMERIC > (v_field->'config'->>'max')::NUMERIC THEN
            RETURN FALSE;
          END IF;
        END IF;
      WHEN 'select', 'multiselect' THEN
        -- Should have choices
        IF NOT (v_field->'config' ? 'choices' AND jsonb_array_length(v_field->'config'->'choices') > 0) THEN
          RETURN FALSE;
        END IF;
      WHEN 'reference' THEN
        -- Should have reference_type
        IF NOT (v_field->'config' ? 'reference_type') THEN
          RETURN FALSE;
        END IF;
      ELSE
        -- Other types don't need special validation yet
        NULL;
    END CASE;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

-- Function to calculate formula fields
CREATE OR REPLACE FUNCTION calculate_formula_fields(
  p_schema JSONB,
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_field JSONB;
  v_formula TEXT;
  v_result JSONB;
BEGIN
  v_result := p_data;
  
  -- Process each formula field
  FOR v_field IN 
    SELECT * FROM jsonb_array_elements(p_schema->'fields')
    WHERE value->>'type' = 'formula'
  LOOP
    v_formula := v_field->'config'->>'formula';
    
    -- For now, store the formula as-is
    -- In production, we'd evaluate it here
    v_result := jsonb_set(
      v_result,
      ARRAY[v_field->>'key'],
      to_jsonb(v_formula)
    );
  END LOOP;
  
  RETURN v_result;
END;
$$;

-- Function to apply template to node
CREATE OR REPLACE FUNCTION apply_field_template(
  p_node_id UUID,
  p_template_id UUID,
  p_merge BOOLEAN DEFAULT false
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_template custom_field_templates;
  v_current_schema JSONB;
  v_new_schema JSONB;
BEGIN
  -- Get template
  SELECT * INTO v_template 
  FROM custom_field_templates 
  WHERE id = p_template_id;
  
  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- Get current schema if merging
  IF p_merge THEN
    SELECT custom_schema INTO v_current_schema
    FROM content_nodes
    WHERE id = p_node_id;
    
    -- Merge fields arrays
    v_new_schema := jsonb_build_object(
      'version', COALESCE(v_current_schema->>'version', '1')::INT + 1,
      'fields', COALESCE(v_current_schema->'fields', '[]'::JSONB) || v_template.fields,
      'template_id', p_template_id::TEXT,
      'template_version', v_template.version
    );
  ELSE
    -- Replace with template
    v_new_schema := jsonb_build_object(
      'version', 1,
      'fields', v_template.fields,
      'template_id', p_template_id::TEXT,
      'template_version', v_template.version
    );
  END IF;
  
  -- Update node
  UPDATE content_nodes
  SET 
    custom_schema = v_new_schema,
    custom_data = CASE 
      WHEN p_merge THEN COALESCE(custom_data, '{}'::JSONB)
      ELSE v_template.example_data
    END,
    schema_version = (v_new_schema->>'version')::INT,
    updated_at = NOW()
  WHERE id = p_node_id;
  
  -- Increment usage count
  UPDATE custom_field_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
  
  RETURN TRUE;
END;
$$;

-- Insert some official starter templates
INSERT INTO custom_field_templates (
  slug, name, description, category, tags, applicable_to, fields, example_data, is_public
) VALUES 
(
  'basic-stats',
  'Basic Character Stats',
  'Standard RPG character statistics',
  'official',
  ARRAY['rpg', 'stats', 'character'],
  ARRAY['character'],
  '[
    {
      "id": "str",
      "key": "strength",
      "label": "Stärke",
      "type": "number",
      "category": "attributes",
      "description": "Physische Kraft",
      "config": {"min": 1, "max": 20, "default": 10}
    },
    {
      "id": "dex",
      "key": "dexterity",
      "label": "Geschicklichkeit",
      "type": "number",
      "category": "attributes",
      "description": "Beweglichkeit und Reflexe",
      "config": {"min": 1, "max": 20, "default": 10}
    },
    {
      "id": "int",
      "key": "intelligence",
      "label": "Intelligenz",
      "type": "number",
      "category": "attributes",
      "description": "Verstand und Wissen",
      "config": {"min": 1, "max": 20, "default": 10}
    },
    {
      "id": "hp",
      "key": "health_points",
      "label": "Lebenspunkte",
      "type": "range",
      "category": "resources",
      "description": "Aktuelle/Maximale Lebenspunkte",
      "config": {"min": 0, "max": 100, "default": 100}
    }
  ]'::JSONB,
  '{"strength": 10, "dexterity": 10, "intelligence": 10, "health_points": 100}'::JSONB,
  true
),
(
  'inventory-basic',
  'Basic Inventory',
  'Simple inventory management fields',
  'official',
  ARRAY['inventory', 'items', 'general'],
  ARRAY['character', 'object', 'place'],
  '[
    {
      "id": "inv",
      "key": "inventory",
      "label": "Inventar",
      "type": "list",
      "category": "items",
      "description": "Liste von Gegenständen",
      "config": {"item_type": "text"}
    },
    {
      "id": "weight",
      "key": "carry_weight",
      "label": "Traglast",
      "type": "number",
      "category": "items",
      "description": "Aktuelles Gewicht in kg",
      "config": {"min": 0, "max": 1000, "default": 0, "unit": "kg"}
    },
    {
      "id": "gold",
      "key": "gold",
      "label": "Gold",
      "type": "number",
      "category": "resources",
      "description": "Verfügbares Gold",
      "config": {"min": 0, "default": 0}
    }
  ]'::JSONB,
  '{"inventory": [], "carry_weight": 0, "gold": 100}'::JSONB,
  true
),
(
  'relationships',
  'Relationship Tracker',
  'Track relationships between characters',
  'official',
  ARRAY['social', 'relationships', 'character'],
  ARRAY['character'],
  '[
    {
      "id": "rep",
      "key": "reputation",
      "label": "Reputation",
      "type": "range",
      "category": "social",
      "description": "Allgemeiner Ruf",
      "config": {"min": -100, "max": 100, "default": 0}
    },
    {
      "id": "allies",
      "key": "allies",
      "label": "Verbündete",
      "type": "list",
      "category": "relationships",
      "description": "Liste von Verbündeten",
      "config": {"item_type": "reference", "reference_type": "character"}
    },
    {
      "id": "enemies",
      "key": "enemies",
      "label": "Feinde",
      "type": "list",
      "category": "relationships",
      "description": "Liste von Feinden",
      "config": {"item_type": "reference", "reference_type": "character"}
    }
  ]'::JSONB,
  '{"reputation": 0, "allies": [], "enemies": []}'::JSONB,
  true
);

-- Add comment explaining the structure
COMMENT ON COLUMN content_nodes.custom_schema IS 'User-defined field schema for flexible mechanics - contains field definitions, types, and validation rules';
COMMENT ON COLUMN content_nodes.custom_data IS 'Actual values for the custom fields defined in custom_schema';
COMMENT ON COLUMN content_nodes.schema_version IS 'Version number for schema migrations and compatibility';
COMMENT ON TABLE custom_field_templates IS 'Reusable templates for custom field schemas that can be shared and applied to nodes';