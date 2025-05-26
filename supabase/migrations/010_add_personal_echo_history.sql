-- Migration: Add Personal Echo History System
-- This allows users to view their submitted echoes with engagement statistics

-- Function to get user's echo history with engagement stats
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
  times_seen INTEGER
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
    COALESCE(seen_count.count, 0)::INTEGER as times_seen
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
      SELECT MIN(seen_at) 
      FROM seen_echoes 
      WHERE echo_id = e.id
    )
  )
  ORDER BY e.created_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_echo_history(UUID) TO authenticated;

-- Function to get user echo statistics
CREATE OR REPLACE FUNCTION get_user_echo_stats(p_user_id UUID)
RETURNS TABLE(
  total_echoes INTEGER,
  total_reactions_received INTEGER,
  most_popular_echo_id UUID,
  most_popular_echo_reactions INTEGER,
  favorite_mood TEXT,
  favorite_mood_emoji TEXT,
  days_active INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_echoes_subquery TEXT;
BEGIN
  -- Create a subquery to get user's echoes (same logic as above)
  user_echoes_subquery := '
    SELECT e.id, e.total_reactions, e.mood_id, e.created_at
    FROM echoes e
    WHERE e.created_at >= (
      SELECT created_at 
      FROM seen_echoes 
      WHERE user_id = ''' || p_user_id || ''' 
      ORDER BY created_at ASC 
      LIMIT 1
    )
    AND EXISTS (
      SELECT 1 FROM seen_echoes se
      WHERE se.echo_id = e.id 
      AND se.user_id = ''' || p_user_id || '''
      AND se.seen_at = (
        SELECT MIN(seen_at) 
        FROM seen_echoes 
        WHERE echo_id = e.id
      )
    )
  ';

  RETURN QUERY
  WITH user_echoes AS (
    SELECT e.id, e.total_reactions, e.mood_id, e.created_at
    FROM echoes e
    WHERE e.created_at >= (
      SELECT se.created_at 
      FROM seen_echoes se
      WHERE se.user_id = p_user_id 
      ORDER BY se.created_at ASC 
      LIMIT 1
    )
    AND EXISTS (
      SELECT 1 FROM seen_echoes se
      WHERE se.echo_id = e.id 
      AND se.user_id = p_user_id
      AND se.seen_at = (
        SELECT MIN(seen_at) 
        FROM seen_echoes 
        WHERE echo_id = e.id
      )
    )
  ),
  mood_stats AS (
    SELECT 
      ue.mood_id,
      m.name as mood_name,
      m.emoji as mood_emoji,
      COUNT(*) as mood_count
    FROM user_echoes ue
    LEFT JOIN echo_moods m ON ue.mood_id = m.id
    WHERE ue.mood_id IS NOT NULL
    GROUP BY ue.mood_id, m.name, m.emoji
    ORDER BY mood_count DESC
    LIMIT 1
  )
  SELECT 
    COALESCE(COUNT(ue.id), 0)::INTEGER as total_echoes,
    COALESCE(SUM(ue.total_reactions), 0)::INTEGER as total_reactions_received,
    (SELECT id FROM user_echoes ORDER BY total_reactions DESC LIMIT 1) as most_popular_echo_id,
    COALESCE(MAX(ue.total_reactions), 0)::INTEGER as most_popular_echo_reactions,
    COALESCE(ms.mood_name, 'None') as favorite_mood,
    COALESCE(ms.mood_emoji, '🤔') as favorite_mood_emoji,
    COALESCE(
      DATE_PART('day', MAX(ue.created_at) - MIN(ue.created_at))::INTEGER + 1, 
      0
    ) as days_active
  FROM user_echoes ue
  LEFT JOIN mood_stats ms ON true
  GROUP BY ms.mood_name, ms.mood_emoji;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_echo_stats(UUID) TO authenticated; 