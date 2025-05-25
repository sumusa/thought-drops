export interface EchoMood {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  created_at: string;
}

export interface EchoWithMood {
  id: string;
  content: string;
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
  user_like_reaction: boolean;
  user_love_reaction: boolean;
  user_laugh_reaction: boolean;
  user_think_reaction: boolean;
  user_sad_reaction: boolean;
  user_fire_reaction: boolean;
} 