-- Enable RLS on all tables
ALTER TABLE content_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- content_nodes policies
-- Public content is readable by everyone
CREATE POLICY "Public content is viewable by everyone" 
ON content_nodes FOR SELECT 
USING (visibility = 'public');

-- Shared content is readable by authenticated users
CREATE POLICY "Shared content is viewable by authenticated users" 
ON content_nodes FOR SELECT 
TO authenticated
USING (visibility = 'shared');

-- Private content is only viewable by owner
CREATE POLICY "Private content is only viewable by owner" 
ON content_nodes FOR SELECT 
TO authenticated
USING (visibility = 'private' AND auth.uid() = owner_id);

-- Users can insert their own content
CREATE POLICY "Users can insert their own content" 
ON content_nodes FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Users can update their own content
CREATE POLICY "Users can update their own content" 
ON content_nodes FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own content
CREATE POLICY "Users can delete their own content" 
ON content_nodes FOR DELETE 
TO authenticated
USING (auth.uid() = owner_id);

-- story_entries policies
-- Story entries follow the visibility of their parent story
CREATE POLICY "Story entries inherit story visibility" 
ON story_entries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = story_entries.story_slug
    AND (
      cn.visibility = 'public' 
      OR (cn.visibility = 'shared' AND auth.uid() IS NOT NULL)
      OR (cn.visibility = 'private' AND cn.owner_id = auth.uid())
    )
  )
);

-- Only story owners can insert entries
CREATE POLICY "Story owners can insert entries" 
ON story_entries FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = story_entries.story_slug
    AND cn.owner_id = auth.uid()
  )
);

-- Only story owners can update entries
CREATE POLICY "Story owners can update entries" 
ON story_entries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = story_entries.story_slug
    AND cn.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = story_entries.story_slug
    AND cn.owner_id = auth.uid()
  )
);

-- Only story owners can delete entries
CREATE POLICY "Story owners can delete entries" 
ON story_entries FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = story_entries.story_slug
    AND cn.owner_id = auth.uid()
  )
);

-- node_revisions policies
-- Revisions follow the same rules as their parent nodes
CREATE POLICY "Revisions inherit node visibility" 
ON node_revisions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.id = node_revisions.node_id
    AND (
      cn.visibility = 'public' 
      OR (cn.visibility = 'shared' AND auth.uid() IS NOT NULL)
      OR (cn.visibility = 'private' AND cn.owner_id = auth.uid())
    )
  )
);

-- Only node owners can insert revisions
CREATE POLICY "Node owners can insert revisions" 
ON node_revisions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.id = node_revisions.node_id
    AND cn.owner_id = auth.uid()
  )
);

-- attachments policies
-- Attachments follow the same rules as their parent nodes
CREATE POLICY "Attachments inherit node visibility" 
ON attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = attachments.node_slug
    AND (
      cn.visibility = 'public' 
      OR (cn.visibility = 'shared' AND auth.uid() IS NOT NULL)
      OR (cn.visibility = 'private' AND cn.owner_id = auth.uid())
    )
  )
);

-- Only node owners can manage attachments
CREATE POLICY "Node owners can insert attachments" 
ON attachments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = attachments.node_slug
    AND cn.owner_id = auth.uid()
  )
);

CREATE POLICY "Node owners can delete attachments" 
ON attachments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM content_nodes cn
    WHERE cn.slug = attachments.node_slug
    AND cn.owner_id = auth.uid()
  )
);