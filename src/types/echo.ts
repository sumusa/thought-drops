import type { EchoWithReactions } from './reactions';
import type { EchoWithMood } from './moods';

export interface Echo extends EchoWithReactions, EchoWithMood {
  // Legacy compatibility - keeping old interface for now
  likes_count: number;
  is_liked_by_user: boolean;
  reply_count: number;
  created_at: string;
} 