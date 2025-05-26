export interface EchoReply {
  id: string;
  parent_echo_id: string;
  parent_reply_id: string | null;
  content: string;
  mood_id: string | null;
  mood_name: string | null;
  mood_emoji: string | null;
  mood_color: string | null;
  thread_depth: number;
  anonymous_name: string;
  anonymous_color: string;
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
  created_at: string;
}

export interface ThreadParticipant {
  id: string;
  echo_id: string;
  user_id: string;
  anonymous_name: string;
  anonymous_color: string;
  created_at: string;
}

export interface ReplySubmission {
  parent_echo_id: string;
  parent_reply_id?: string;
  content: string;
  mood_id?: string;
}

export interface ThreadTree {
  [replyId: string]: {
    reply: EchoReply;
    children: ThreadTree;
  };
}

export interface ThreadStats {
  total_replies: number;
  total_participants: number;
  max_depth: number;
} 