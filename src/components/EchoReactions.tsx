import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import type { ReactionType, ReactionConfig } from '@/types/reactions';
import { REACTION_CONFIGS } from '@/types/reactions';

interface EchoReactionsProps {
  echoId: string;
  userId: string;
  reactions: {
    like_count: number;
    love_count: number;
    laugh_count: number;
    think_count: number;
    sad_count: number;
    fire_count: number;
  };
  userReactions: {
    user_like_reaction: boolean;
    user_love_reaction: boolean;
    user_laugh_reaction: boolean;
    user_think_reaction: boolean;
    user_sad_reaction: boolean;
    user_fire_reaction: boolean;
  };
  onReactionChange?: () => void;
}

export function EchoReactions({ 
  echoId, 
  userId, 
  reactions, 
  userReactions, 
  onReactionChange 
}: EchoReactionsProps) {
  const [isLoading, setIsLoading] = useState<ReactionType | null>(null);

  const handleReaction = async (reactionType: ReactionType) => {
    if (isLoading) return;
    
    setIsLoading(reactionType);
    
    try {
      const { error } = await supabase.rpc('toggle_echo_reaction', {
        p_echo_id: echoId,
        p_user_id: userId,
        p_reaction_type: reactionType
      });

      if (error) {
        console.error('Error toggling reaction:', error);
        return;
      }

      onReactionChange?.();
    } catch (error) {
      console.error('Error toggling reaction:', error);
    } finally {
      setIsLoading(null);
    }
  };

  const getReactionCount = (type: ReactionType): number => {
    return reactions[`${type}_count` as keyof typeof reactions];
  };

  const getUserReaction = (type: ReactionType): boolean => {
    return userReactions[`user_${type}_reaction` as keyof typeof userReactions];
  };

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {REACTION_CONFIGS.map((config: ReactionConfig) => {
        const count = getReactionCount(config.type);
        const isUserReacted = getUserReaction(config.type);
        const isCurrentlyLoading = isLoading === config.type;

        return (
          <Button
            key={config.type}
            variant="outline"
            size="sm"
            onClick={() => handleReaction(config.type)}
            disabled={isCurrentlyLoading}
            className={`
              relative overflow-hidden transition-all duration-200 
              ${isUserReacted 
                ? 'bg-gradient-to-r from-slate-700 to-slate-600 border-slate-500 text-white' 
                : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50'
              }
              ${isCurrentlyLoading ? 'opacity-50' : ''}
            `}
          >
            <span className="text-base mr-1">{config.emoji}</span>
            <span className="text-sm font-medium">
              {count > 0 ? count : ''}
            </span>
            
            {/* Shimmer effect for active reactions */}
            {isUserReacted && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
            )}
          </Button>
        );
      })}
    </div>
  );
} 