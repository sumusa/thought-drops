-- Migration: Add Echo Threads/Conversations System
-- This allows users to reply to echoes and create threaded conversations

-- Create echo_replies table
CREATE TABLE IF NOT EXISTS echo_replies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_echo_id UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
  parent_reply_id UUID REFERENCES echo_replies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  mood_id UUID REFERENCES echo_moods(id),
  thread_depth INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  love_count INTEGER DEFAULT 0,
  laugh_count INTEGER DEFAULT 0,
  think_count INTEGER DEFAULT 0,
  sad_count INTEGER DEFAULT 0,
  fire_count INTEGER DEFAULT 0,
  total_reactions INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure replies don't go too deep (max 5 levels)
  CONSTRAINT max_thread_depth CHECK (thread_depth <= 5)
);

-- Create thread_participants table for anonymous identity management
CREATE TABLE IF NOT EXISTS thread_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  echo_id UUID NOT NULL REFERENCES echoes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  anonymous_name TEXT NOT NULL,
  anonymous_color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Each user gets one anonymous identity per thread
  UNIQUE(echo_id, user_id)
);

-- Create reply_reactions table (similar to echo_reactions)
CREATE TABLE IF NOT EXISTS reply_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reply_id UUID NOT NULL REFERENCES echo_replies(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'think', 'sad', 'fire')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One reaction per user per reply
  UNIQUE(user_id, reply_id)
);

-- Add reply_count to echoes table
ALTER TABLE echoes ADD COLUMN IF NOT EXISTS reply_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_echo_replies_parent_echo ON echo_replies(parent_echo_id);
CREATE INDEX IF NOT EXISTS idx_echo_replies_parent_reply ON echo_replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_echo_replies_user ON echo_replies(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_echo ON thread_participants(echo_id);
CREATE INDEX IF NOT EXISTS idx_thread_participants_user ON thread_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_reply_reactions_reply ON reply_reactions(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_reactions_user ON reply_reactions(user_id);

-- RLS policies
ALTER TABLE echo_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_reactions ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all replies
CREATE POLICY "Users can read all replies" ON echo_replies
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert their own replies
CREATE POLICY "Users can insert their own replies" ON echo_replies
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read thread participants
CREATE POLICY "Users can read thread participants" ON thread_participants
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert their own thread participation
CREATE POLICY "Users can insert their own thread participation" ON thread_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all reply reactions
CREATE POLICY "Users can read all reply reactions" ON reply_reactions
  FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert their own reply reactions
CREATE POLICY "Users can insert their own reply reactions" ON reply_reactions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own reply reactions
CREATE POLICY "Users can delete their own reply reactions" ON reply_reactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Function to get or create anonymous identity for a thread
CREATE OR REPLACE FUNCTION get_or_create_thread_identity(
  p_echo_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  anonymous_name TEXT,
  anonymous_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_anonymous_name TEXT;
  v_anonymous_color TEXT;
  v_participant_count INTEGER;
  v_colors TEXT[] := ARRAY['Blue', 'Purple', 'Green', 'Orange', 'Pink', 'Cyan', 'Yellow', 'Red', 'Indigo', 'Teal'];
  v_color_classes TEXT[] := ARRAY['text-blue-400', 'text-purple-400', 'text-green-400', 'text-orange-400', 'text-pink-400', 'text-cyan-400', 'text-yellow-400', 'text-red-400', 'text-indigo-400', 'text-teal-400'];
BEGIN
  -- Check if user already has an identity in this thread
  SELECT tp.anonymous_name, tp.anonymous_color
  INTO v_anonymous_name, v_anonymous_color
  FROM thread_participants tp
  WHERE tp.echo_id = p_echo_id AND tp.user_id = p_user_id;
  
  -- If not found, create a new identity
  IF v_anonymous_name IS NULL THEN
    -- Count existing participants to assign next color
    SELECT COUNT(*) INTO v_participant_count
    FROM thread_participants
    WHERE echo_id = p_echo_id;
    
    -- Assign color based on participant count (cycle through colors)
    v_anonymous_name := 'Anonymous ' || v_colors[(v_participant_count % array_length(v_colors, 1)) + 1];
    v_anonymous_color := v_color_classes[(v_participant_count % array_length(v_color_classes, 1)) + 1];
    
    -- Insert the new identity
    INSERT INTO thread_participants (echo_id, user_id, anonymous_name, anonymous_color)
    VALUES (p_echo_id, p_user_id, v_anonymous_name, v_anonymous_color);
  END IF;
  
  RETURN QUERY SELECT v_anonymous_name, v_anonymous_color;
END;
$$;

-- Function to submit a reply
CREATE OR REPLACE FUNCTION submit_echo_reply(
  p_parent_echo_id UUID,
  p_parent_reply_id UUID,
  p_user_id UUID,
  p_content TEXT,
  p_mood_id UUID DEFAULT NULL
)
RETURNS TABLE(
  reply_id UUID,
  anonymous_name TEXT,
  anonymous_color TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reply_id UUID;
  v_thread_depth INTEGER := 0;
  v_anonymous_name TEXT;
  v_anonymous_color TEXT;
BEGIN
  -- Calculate thread depth
  IF p_parent_reply_id IS NOT NULL THEN
    SELECT thread_depth + 1 INTO v_thread_depth
    FROM echo_replies
    WHERE id = p_parent_reply_id;
  END IF;
  
  -- Get or create anonymous identity
  SELECT ai.anonymous_name, ai.anonymous_color
  INTO v_anonymous_name, v_anonymous_color
  FROM get_or_create_thread_identity(p_parent_echo_id, p_user_id) ai;
  
  -- Insert the reply
  INSERT INTO echo_replies (
    parent_echo_id,
    parent_reply_id,
    user_id,
    content,
    mood_id,
    thread_depth
  )
  VALUES (
    p_parent_echo_id,
    p_parent_reply_id,
    p_user_id,
    p_content,
    p_mood_id,
    v_thread_depth
  )
  RETURNING id INTO v_reply_id;
  
  -- Update reply count on parent echo
  UPDATE echoes
  SET reply_count = reply_count + 1
  WHERE id = p_parent_echo_id;
  
  RETURN QUERY SELECT v_reply_id, v_anonymous_name, v_anonymous_color;
END;
$$;

-- Function to get thread replies
CREATE OR REPLACE FUNCTION get_echo_thread(p_echo_id UUID, p_user_id UUID)
RETURNS TABLE(
  id UUID,
  parent_reply_id UUID,
  content TEXT,
  mood_id UUID,
  mood_name TEXT,
  mood_emoji TEXT,
  mood_color TEXT,
  thread_depth INTEGER,
  anonymous_name TEXT,
  anonymous_color TEXT,
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
  user_fire_reaction BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.parent_reply_id,
    r.content,
    r.mood_id,
    m.name as mood_name,
    m.emoji as mood_emoji,
    m.color as mood_color,
    r.thread_depth,
    tp.anonymous_name,
    tp.anonymous_color,
    r.like_count,
    r.love_count,
    r.laugh_count,
    r.think_count,
    r.sad_count,
    r.fire_count,
    r.total_reactions,
    EXISTS(SELECT 1 FROM reply_reactions WHERE user_id = p_user_id AND reply_id = r.id AND reaction_type = 'like') as user_like_reaction,
    EXISTS(SELECT 1 FROM reply_reactions WHERE user_id = p_user_id AND reply_id = r.id AND reaction_type = 'love') as user_love_reaction,
    EXISTS(SELECT 1 FROM reply_reactions WHERE user_id = p_user_id AND reply_id = r.id AND reaction_type = 'laugh') as user_laugh_reaction,
    EXISTS(SELECT 1 FROM reply_reactions WHERE user_id = p_user_id AND reply_id = r.id AND reaction_type = 'think') as user_think_reaction,
    EXISTS(SELECT 1 FROM reply_reactions WHERE user_id = p_user_id AND reply_id = r.id AND reaction_type = 'sad') as user_sad_reaction,
    EXISTS(SELECT 1 FROM reply_reactions WHERE user_id = p_user_id AND reply_id = r.id AND reaction_type = 'fire') as user_fire_reaction,
    r.created_at
  FROM echo_replies r
  LEFT JOIN echo_moods m ON r.mood_id = m.id
  LEFT JOIN thread_participants tp ON tp.echo_id = r.parent_echo_id AND tp.user_id = r.user_id
  WHERE r.parent_echo_id = p_echo_id
  ORDER BY r.created_at ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_thread_identity(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_echo_reply(UUID, UUID, UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_echo_thread(UUID, UUID) TO authenticated; 