import React from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { EchoReply } from '@/types/threads';

interface ReplyReactionsProps {
  reply: EchoReply;
  onReactionChange: () => void;
}

const REACTIONS = [
  { type: 'like', emoji: '👍', label: 'Like' },
  { type: 'love', emoji: '❤️', label: 'Love' },
  { type: 'laugh', emoji: '😂', label: 'Laugh' },
  { type: 'think', emoji: '🤔', label: 'Think' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'fire', emoji: '🔥', label: 'Fire' },
] as const;

export function ReplyReactions({ reply, onReactionChange }: ReplyReactionsProps) {
  const handleReaction = async (reactionType: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user already has this reaction
      const currentReactionKey = `user_${reactionType}_reaction` as keyof EchoReply;
      const hasReaction = reply[currentReactionKey] as boolean;

      if (hasReaction) {
        // Remove reaction
        const { error } = await supabase
          .from('reply_reactions')
          .delete()
          .eq('user_id', user.id)
          .eq('reply_id', reply.id)
          .eq('reaction_type', reactionType);

        if (error) throw error;

        // Update reply reaction counts
        const countKey = `${reactionType}_count`;
        const { error: updateError } = await supabase
          .from('echo_replies')
          .update({
            [countKey]: Math.max(0, reply[countKey as keyof EchoReply] as number - 1),
            total_reactions: Math.max(0, reply.total_reactions - 1)
          })
          .eq('id', reply.id);

        if (updateError) throw updateError;
      } else {
        // Add reaction (this will replace any existing reaction due to unique constraint)
        const { error } = await supabase
          .from('reply_reactions')
          .upsert({
            user_id: user.id,
            reply_id: reply.id,
            reaction_type: reactionType
          });

        if (error) throw error;

        // Update reply reaction counts
        const countKey = `${reactionType}_count`;
        const { error: updateError } = await supabase
          .from('echo_replies')
          .update({
            [countKey]: (reply[countKey as keyof EchoReply] as number) + 1,
            total_reactions: reply.total_reactions + 1
          })
          .eq('id', reply.id);

        if (updateError) throw updateError;
      }

      onReactionChange();
    } catch (error) {
      console.error('Error toggling reply reaction:', error);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      {REACTIONS.map(({ type, emoji, label }) => {
        const countKey = `${type}_count` as keyof EchoReply;
        const userReactionKey = `user_${type}_reaction` as keyof EchoReply;
        const count = reply[countKey] as number;
        const isActive = reply[userReactionKey] as boolean;

        return (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            className={`
              flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 text-purple-300 shadow-lg shadow-purple-500/10' 
                : 'bg-gray-800/50 border border-gray-700/50 text-gray-400 hover:bg-gray-700/50 hover:border-gray-600/50'
              }
              ${isActive ? 'animate-pulse' : ''}
            `}
            title={label}
          >
            <span className="text-sm">{emoji}</span>
            {count > 0 && (
              <span className={`font-medium ${isActive ? 'text-purple-300' : 'text-gray-300'}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
} 