-- SQL script to modify the documents table by removing the title field
-- Since we'll be extracting titles from the content field, we no longer need a separate title field

-- First, remove the NOT NULL constraint from the title field
ALTER TABLE documents ALTER COLUMN title DROP NOT NULL;

-- Then add a comment to indicate that titles should be extracted from content
COMMENT ON TABLE documents IS 'Document titles are extracted from the content field (first H1 heading or first line)';

-- Note: We're not actually dropping the column yet to maintain backward compatibility
-- This allows for a gradual transition where the application can work with both models
-- Once the application is fully updated, you can run:
-- ALTER TABLE documents DROP COLUMN title;
