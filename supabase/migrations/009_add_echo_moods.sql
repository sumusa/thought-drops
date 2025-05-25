-- Migration: Add Echo Moods/Categories System
-- This allows users to categorize their echoes by emotional context

-- Create moods table
CREATE TABLE IF NOT EXISTS echo_moods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default moods
INSERT INTO echo_moods (name, emoji, color, description) VALUES
  ('reflective', '🤔', 'text-purple-400', 'Deep thoughts and contemplation'),
  ('hopeful', '🌟', 'text-yellow-400', 'Optimistic and uplifting thoughts'),
  ('melancholy', '🌧️', 'text-blue-400', 'Bittersweet and contemplative feelings'),
  ('excited', '⚡', 'text-orange-400', 'Energetic and enthusiastic thoughts'),
  ('grateful', '🙏', 'text-green-400', 'Appreciation and thankfulness'),
  ('curious', '🔍', 'text-cyan-400', 'Questions and wonderings'),
  ('peaceful', '🕊️', 'text-indigo-400', 'Calm and serene thoughts'),
  ('creative', '🎨', 'text-pink-400', 'Artistic and imaginative ideas'),
  ('nostalgic', '📸', 'text-amber-400', 'Memories and past reflections'),
  ('philosophical', '🧠', 'text-violet-400', 'Life questions and deep thinking')
ON CONFLICT (name) DO NOTHING;

-- Add mood_id to echoes table
ALTER TABLE echoes ADD COLUMN IF NOT EXISTS mood_id UUID REFERENCES echo_moods(id);

-- Create index for mood filtering
CREATE INDEX IF NOT EXISTS idx_echoes_mood_id ON echoes(mood_id);

-- RLS policies for echo_moods (public read)
ALTER TABLE echo_moods ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read moods
CREATE POLICY "Anyone can read moods" ON echo_moods
  FOR SELECT
  USING (true);

-- Update the get_random_unseen_echo_with_reactions function to include mood data
CREATE OR REPLACE FUNCTION get_random_unseen_echo_with_reactions(p_user_id UUID, p_mood_filter UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  content TEXT,
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
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'like') as user_like_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'love') as user_love_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'laugh') as user_laugh_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'think') as user_think_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'sad') as user_sad_reaction,
    EXISTS(SELECT 1 FROM echo_reactions WHERE user_id = p_user_id AND echo_id = e.id AND reaction_type = 'fire') as user_fire_reaction
  FROM echoes e
  LEFT JOIN echo_moods m ON e.mood_id = m.id
  WHERE e.id NOT IN (
    SELECT echo_id FROM seen_echoes WHERE user_id = p_user_id
  )
  AND (p_mood_filter IS NULL OR e.mood_id = p_mood_filter)
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$; 