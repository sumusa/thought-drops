export type ReactionType = 'like' | 'love' | 'laugh' | 'think' | 'sad' | 'fire';

export interface ReactionCounts {
  like_count: number;
  love_count: number;
  laugh_count: number;
  think_count: number;
  sad_count: number;
  fire_count: number;
  total_reactions: number;
}

export interface UserReactions {
  user_like_reaction: boolean;
  user_love_reaction: boolean;
  user_laugh_reaction: boolean;
  user_think_reaction: boolean;
  user_sad_reaction: boolean;
  user_fire_reaction: boolean;
}

export interface EchoWithReactions {
  id: string;
  content: string;
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

export interface ReactionConfig {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}

export const REACTION_CONFIGS: ReactionConfig[] = [
  { type: 'like', emoji: '👍', label: 'Like', color: 'text-blue-400' },
  { type: 'love', emoji: '❤️', label: 'Love', color: 'text-red-400' },
  { type: 'laugh', emoji: '😂', label: 'Laugh', color: 'text-yellow-400' },
  { type: 'think', emoji: '🤔', label: 'Think', color: 'text-purple-400' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: 'text-blue-300' },
  { type: 'fire', emoji: '🔥', label: 'Fire', color: 'text-orange-400' },
]; 