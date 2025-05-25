-- Migration: Add Echo Reactions System
-- This replaces the simple likes system with multiple emoji reactions

-- Create reactions table
CREATE TABLE IF NOT EXISTS echo_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  echo_id UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'think', 'sad', 'fire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, echo_id, reaction_type)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_echo_reactions_user_id ON echo_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_echo_reactions_echo_id ON echo_reactions(echo_id);
CREATE INDEX IF NOT EXISTS idx_echo_reactions_type ON echo_reactions(reaction_type);

-- Add reaction counts to echoes table
ALTER TABLE echoes 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS love_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS laugh_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS think_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sad_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS fire_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_reactions INTEGER DEFAULT 0;

-- Remove old likes_count column (we'll keep it for now for backward compatibility)
-- ALTER TABLE echoes DROP COLUMN IF EXISTS likes_count;

-- RLS policies for echo_reactions
ALTER TABLE echo_reactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert their own reactions
CREATE POLICY "Users can insert their own reactions" ON echo_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all reactions
CREATE POLICY "Users can read all reactions" ON echo_reactions
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to delete their own reactions
CREATE POLICY "Users can delete their own reactions" ON echo_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Function to toggle echo reaction
CREATE OR REPLACE FUNCTION toggle_echo_reaction(
  p_echo_id UUID,
  p_user_id UUID,
  p_reaction_type TEXT
)
RETURNS TABLE(
  is_reacted BOOLEAN,
  new_count INTEGER,
  total_reactions INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reaction_exists BOOLEAN;
  new_reaction_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Check if reaction already exists
  SELECT EXISTS(
    SELECT 1 FROM echo_reactions 
    WHERE user_id = p_user_id 
    AND echo_id = p_echo_id 
    AND reaction_type = p_reaction_type
  ) INTO reaction_exists;

  IF reaction_exists THEN
    -- Remove reaction
    DELETE FROM echo_reactions 
    WHERE user_id = p_user_id 
    AND echo_id = p_echo_id 
    AND reaction_type = p_reaction_type;
    
    -- Update count in echoes table
    EXECUTE format('UPDATE echoes SET %I = GREATEST(0, %I - 1) WHERE id = $1', 
                   p_reaction_type || '_count', p_reaction_type || '_count') 
    USING p_echo_id;
    
    is_reacted := FALSE;
  ELSE
    -- Add reaction
    INSERT INTO echo_reactions (user_id, echo_id, reaction_type)
    VALUES (p_user_id, p_echo_id, p_reaction_type)
    ON CONFLICT (user_id, echo_id, reaction_type) DO NOTHING;
    
    -- Update count in echoes table
    EXECUTE format('UPDATE echoes SET %I = %I + 1 WHERE id = $1', 
                   p_reaction_type || '_count', p_reaction_type || '_count') 
    USING p_echo_id;
    
    is_reacted := TRUE;
  END IF;

  -- Get updated count for this reaction type
  EXECUTE format('SELECT %I FROM echoes WHERE id = $1', p_reaction_type || '_count') 
  INTO new_reaction_count USING p_echo_id;

  -- Update total reactions count
  UPDATE echoes 
  SET total_reactions = like_count + love_count + laugh_count + think_count + sad_count + fire_count
  WHERE id = p_echo_id;

  -- Get updated total count
  SELECT total_reactions INTO total_count FROM echoes WHERE id = p_echo_id;

  RETURN QUERY SELECT is_reacted, new_reaction_count, total_count;
END;
$$;

-- Function to get random unseen echo with reaction data
CREATE OR REPLACE FUNCTION get_random_unseen_echo_with_reactions(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  content TEXT,
  like_count INTEGER,
  love_count INTEGER,
  laugh_count INTEGER,
  think_count INTEGER,
  sad_count INTEGER,
  fire_count INTEGER,
  total_reactions INTEGER,
  user_like_reaction BOOLEAN,
  user_love_reaction BOOLEAN,
  user_laugh_reaction BOOLEAN,
  user_think_reaction BOOLEAN,
  user_sad_reaction BOOLEAN,
  user_fire_reaction BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.content,
    e.like_count,
    e.love_count,
    e.laugh_count,
    e.think_count,
    e.sad_count,
    e.fire_count,
    e.total_reactions,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'like') as user_like_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'love') as user_love_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'laugh') as user_laugh_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'think') as user_think_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'sad') as user_sad_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'fire') as user_fire_reaction
  FROM echoes e
  WHERE e.id NOT IN (
    SELECT echo_id FROM seen_echoes WHERE user_id = p_user_id
  )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$; 