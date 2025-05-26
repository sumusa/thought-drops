export interface UserEcho {
  id: string;
  content: string;
  created_at: string;
  mood_id: string | null;
  mood_name: string | null;
  mood_emoji: string | null;
  mood_color: string | null;
  like_count: number;
  love_count: number;
  laugh_count: number;
  think_count: number;
  sad_count: number;
  fire_count: number;
  total_reactions: number;
  times_seen: number;
}

export interface UserEchoStats {
  total_echoes: number;
  total_reactions_received: number;
  most_popular_echo_id: string | null;
  most_popular_echo_reactions: number;
  favorite_mood: string;
  favorite_mood_emoji: string;
  days_active: number;
} 