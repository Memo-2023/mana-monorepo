-- Migration: Boards/Moodboard System
-- Description: Tables and policies for canvas-based moodboard feature
-- Created: 2025-10-09

-- =====================================================
-- TABLE: boards
-- Description: Stores moodboard metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS public.boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN DEFAULT false,
    canvas_width INTEGER DEFAULT 2000,
    canvas_height INTEGER DEFAULT 1500,
    background_color TEXT DEFAULT '#ffffff',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX idx_boards_user_id ON public.boards(user_id);
CREATE INDEX idx_boards_created_at ON public.boards(created_at DESC);
CREATE INDEX idx_boards_is_public ON public.boards(is_public) WHERE is_public = true;

-- =====================================================
-- TABLE: board_items
-- Description: Stores individual images/items on boards
-- =====================================================
CREATE TABLE IF NOT EXISTS public.board_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,
    scale_x FLOAT NOT NULL DEFAULT 1.0,
    scale_y FLOAT NOT NULL DEFAULT 1.0,
    rotation FLOAT NOT NULL DEFAULT 0,
    z_index INTEGER NOT NULL DEFAULT 0,
    opacity FLOAT NOT NULL DEFAULT 1.0,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(board_id, image_id)
);

-- Indexes for board lookups
CREATE INDEX idx_board_items_board_id ON public.board_items(board_id);
CREATE INDEX idx_board_items_z_index ON public.board_items(board_id, z_index);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================
CREATE OR REPLACE FUNCTION update_boards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_boards_timestamp
    BEFORE UPDATE ON public.boards
    FOR EACH ROW
    EXECUTE FUNCTION update_boards_updated_at();

-- =====================================================
-- RLS POLICIES: boards table
-- =====================================================
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;

-- Users can view their own boards
CREATE POLICY "Users can view own boards"
    ON public.boards
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view public boards
CREATE POLICY "Users can view public boards"
    ON public.boards
    FOR SELECT
    USING (is_public = true);

-- Users can insert their own boards
CREATE POLICY "Users can insert own boards"
    ON public.boards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own boards
CREATE POLICY "Users can update own boards"
    ON public.boards
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own boards
CREATE POLICY "Users can delete own boards"
    ON public.boards
    FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES: board_items table
-- =====================================================
ALTER TABLE public.board_items ENABLE ROW LEVEL SECURITY;

-- Users can view items from their own boards
CREATE POLICY "Users can view items from own boards"
    ON public.board_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.boards
            WHERE boards.id = board_items.board_id
            AND boards.user_id = auth.uid()
        )
    );

-- Users can view items from public boards
CREATE POLICY "Users can view items from public boards"
    ON public.board_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.boards
            WHERE boards.id = board_items.board_id
            AND boards.is_public = true
        )
    );

-- Users can insert items to their own boards
CREATE POLICY "Users can insert items to own boards"
    ON public.board_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boards
            WHERE boards.id = board_items.board_id
            AND boards.user_id = auth.uid()
        )
    );

-- Users can update items on their own boards
CREATE POLICY "Users can update items on own boards"
    ON public.board_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.boards
            WHERE boards.id = board_items.board_id
            AND boards.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.boards
            WHERE boards.id = board_items.board_id
            AND boards.user_id = auth.uid()
        )
    );

-- Users can delete items from their own boards
CREATE POLICY "Users can delete items from own boards"
    ON public.board_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.boards
            WHERE boards.id = board_items.board_id
            AND boards.user_id = auth.uid()
        )
    );

-- =====================================================
-- FUNCTIONS: Helper functions for boards
-- =====================================================

-- Function to get board with item count
CREATE OR REPLACE FUNCTION get_boards_with_counts(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    thumbnail_url TEXT,
    is_public BOOLEAN,
    canvas_width INTEGER,
    canvas_height INTEGER,
    background_color TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    item_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.name,
        b.description,
        b.thumbnail_url,
        b.is_public,
        b.canvas_width,
        b.canvas_height,
        b.background_color,
        b.created_at,
        b.updated_at,
        COUNT(bi.id) as item_count
    FROM public.boards b
    LEFT JOIN public.board_items bi ON b.id = bi.board_id
    WHERE b.user_id = p_user_id
    GROUP BY b.id
    ORDER BY b.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_boards_with_counts(UUID) TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.boards IS 'Stores moodboard/canvas metadata';
COMMENT ON TABLE public.board_items IS 'Stores individual items (images) placed on boards';
COMMENT ON COLUMN public.boards.canvas_width IS 'Canvas width in pixels';
COMMENT ON COLUMN public.boards.canvas_height IS 'Canvas height in pixels';
COMMENT ON COLUMN public.board_items.position_x IS 'X position on canvas in pixels';
COMMENT ON COLUMN public.board_items.position_y IS 'Y position on canvas in pixels';
COMMENT ON COLUMN public.board_items.scale_x IS 'Horizontal scale factor (1.0 = 100%)';
COMMENT ON COLUMN public.board_items.scale_y IS 'Vertical scale factor (1.0 = 100%)';
COMMENT ON COLUMN public.board_items.rotation IS 'Rotation in degrees (0-360)';
COMMENT ON COLUMN public.board_items.z_index IS 'Layer order (higher = on top)';
