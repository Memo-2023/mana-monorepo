-- Add full-text search column
ALTER TABLE content_nodes 
ADD COLUMN search_tsv tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('german', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('german', coalesce(summary, '')), 'B') ||
  setweight(to_tsvector('german', coalesce(content->>'lore', '')), 'C') ||
  setweight(to_tsvector('german', coalesce(content->>'canon_facts_text', '')), 'C') ||
  setweight(to_tsvector('german', coalesce(content->>'glossary_text', '')), 'D') ||
  setweight(to_tsvector('german', coalesce(content->>'appearance', '')), 'D')
) STORED;

-- Create index for full-text search
CREATE INDEX idx_content_nodes_search ON content_nodes USING GIN(search_tsv);

-- Function for searching content
CREATE OR REPLACE FUNCTION search_content_nodes(
  search_query TEXT,
  filter_kind node_kind DEFAULT NULL,
  filter_visibility visibility_level DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  kind node_kind,
  slug TEXT,
  title TEXT,
  summary TEXT,
  visibility visibility_level,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cn.id,
    cn.kind,
    cn.slug,
    cn.title,
    cn.summary,
    cn.visibility,
    ts_rank(cn.search_tsv, websearch_to_tsquery('german', search_query)) as rank
  FROM content_nodes cn
  WHERE 
    cn.search_tsv @@ websearch_to_tsquery('german', search_query)
    AND (filter_kind IS NULL OR cn.kind = filter_kind)
    AND (filter_visibility IS NULL OR cn.visibility = filter_visibility)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;