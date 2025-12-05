-- Add pinned field to spaces table
ALTER TABLE spaces ADD COLUMN pinned BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing spaces to be pinned by default
UPDATE spaces SET pinned = TRUE WHERE pinned IS NULL;

-- Add comment to the column
COMMENT ON COLUMN spaces.pinned IS 'Determines if the space should be shown in the filter section on the startpage';
