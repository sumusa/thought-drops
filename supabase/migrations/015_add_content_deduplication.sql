-- Migration: Add content deduplication to prevent duplicate echoes
-- This prevents identical content from being submitted multiple times

-- Add content_hash column to echoes table
ALTER TABLE echoes ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create index for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_echoes_content_hash ON echoes(content_hash);

-- Function to generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash(content_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create a hash of the normalized content (lowercase, trimmed)
  RETURN encode(digest(lower(trim(content_text)), 'sha256'), 'hex');
END;
$$;

-- Update existing echoes to have content hashes
UPDATE echoes 
SET content_hash = generate_content_hash(content)
WHERE content_hash IS NULL;

-- Function to check for duplicate content before inserting
CREATE OR REPLACE FUNCTION check_duplicate_content(content_text TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  content_hash_value TEXT;
  duplicate_count INTEGER;
BEGIN
  -- Generate hash for the content
  content_hash_value := generate_content_hash(content_text);
  
  -- Check if this content already exists
  SELECT COUNT(*) INTO duplicate_count
  FROM echoes
  WHERE content_hash = content_hash_value;
  
  -- Return true if duplicate exists
  RETURN duplicate_count > 0;
END;
$$;

-- Add constraint to prevent duplicate content hashes
ALTER TABLE echoes ADD CONSTRAINT unique_content_hash UNIQUE (content_hash);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_content_hash(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_content(TEXT) TO authenticated; 