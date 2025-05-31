-- Migration: Add reply_count to user echo history and create paginated function
-- This adds reply count display to the personal echo history

-- Update the get_user_echo_history function to include reply_count
CREATE OR REPLACE FUNCTION get_user_echo_history(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  mood_id UUID,
  mood_name TEXT,
  mood_emoji TEXT,
  mood_color TEXT,
  like_count INTEGER,
  love_count INTEGER,
  laugh_count INTEGER,
  think_count INTEGER,
  sad_count INTEGER,
  fire_count INTEGER,
  total_reactions INTEGER,
  times_seen INTEGER,
  reply_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.content,
    e.created_at,
    e.mood_id,
    m.name as mood_name,
    m.emoji as mood_emoji,
    m.color as mood_color,
    e.like_count,
    e.love_count,
    e.laugh_count,
    e.think_count,
    e.sad_count,
    e.fire_count,
    e.total_reactions,
    COALESCE(seen_count.count, 0)::INTEGER as times_seen,
    COALESCE(e.reply_count, 0)::INTEGER as reply_count
  FROM echoes e
  LEFT JOIN echo_moods m ON e.mood_id = m.id
  LEFT JOIN (
    SELECT echo_id, COUNT(*) as count
    FROM seen_echoes
    GROUP BY echo_id
  ) seen_count ON e.id = seen_count.echo_id
  WHERE e.created_at >= (
    SELECT se.created_at 
    FROM seen_echoes se
    WHERE se.user_id = p_user_id 
    ORDER BY se.created_at ASC 
    LIMIT 1
  )
  -- We can't directly link echoes to users since they're anonymous,
  -- but we can infer ownership by checking if the user was the first to "see" it
  -- This is a workaround for anonymous echo ownership
  AND EXISTS (
    SELECT 1 FROM seen_echoes se
    WHERE se.echo_id = e.id 
    AND se.user_id = p_user_id
    AND se.seen_at = (
      SELECT MIN(se2.seen_at) 
      FROM seen_echoes se2
      WHERE se2.echo_id = e.id
    )
  )
  ORDER BY e.created_at DESC;
END;
$$;

-- Create the paginated version of the function
CREATE OR REPLACE FUNCTION get_user_echo_history_paginated(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  mood_id UUID,
  mood_name TEXT,
  mood_emoji TEXT,
  mood_color TEXT,
  like_count INTEGER,
  love_count INTEGER,
  laugh_count INTEGER,
  think_count INTEGER,
  sad_count INTEGER,
  fire_count INTEGER,
  total_reactions INTEGER,
  times_seen INTEGER,
  reply_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.content,
    e.created_at,
    e.mood_id,
    m.name as mood_name,
    m.emoji as mood_emoji,
    m.color as mood_color,
    e.like_count,
    e.love_count,
    e.laugh_count,
    e.think_count,
    e.sad_count,
    e.fire_count,
    e.total_reactions,
    COALESCE(seen_count.count, 0)::INTEGER as times_seen,
    COALESCE(e.reply_count, 0)::INTEGER as reply_count
  FROM echoes e
  LEFT JOIN echo_moods m ON e.mood_id = m.id
  LEFT JOIN (
    SELECT echo_id, COUNT(*) as count
    FROM seen_echoes
    GROUP BY echo_id
  ) seen_count ON e.id = seen_count.echo_id
  WHERE e.created_at >= (
    SELECT se.created_at 
    FROM seen_echoes se
    WHERE se.user_id = p_user_id 
    ORDER BY se.created_at ASC 
    LIMIT 1
  )
  -- We can't directly link echoes to users since they're anonymous,
  -- but we can infer ownership by checking if the user was the first to "see" it
  -- This is a workaround for anonymous echo ownership
  AND EXISTS (
    SELECT 1 FROM seen_echoes se
    WHERE se.echo_id = e.id 
    AND se.user_id = p_user_id
    AND se.seen_at = (
      SELECT MIN(se2.seen_at) 
      FROM seen_echoes se2
      WHERE se2.echo_id = e.id
    )
  )
  ORDER BY e.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_echo_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_echo_history_paginated(UUID, INTEGER, INTEGER) TO authenticated; 