import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquareQuote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { REACTION_CONFIGS } from '@/types/reactions';
import type { ReactionType } from '@/types/reactions';

interface ReactedEcho {
  id: string;
  content: string;
  like_count: number;
  love_count: number;
  laugh_count: number;
  think_count: number;
  sad_count: number;
  fire_count: number;
  total_reactions: number;
  created_at: string;
  reaction_type: ReactionType;
  reaction_created_at: string;
}

interface LikedEchoesProps {
  user: any;
  onUnlike?: (echoId: string) => void;
  refreshTrigger?: number;
}

const RECENT_REACTIONS_LIMIT = 20;

export function LikedEchoes({ user, onUnlike, refreshTrigger }: LikedEchoesProps) {
  const [reactedEchoes, setReactedEchoes] = useState<ReactedEcho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      fetchReactedEchoes();
    }
  }, [user?.id, refreshTrigger]);

  const fetchReactedEchoes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch the most recently reacted echoes
      const { data, error } = await supabase
        .from('echo_reactions')
        .select(`
          echo_id,
          reaction_type,
          created_at,
          echoes (
            id,
            content,
            like_count,
            love_count,
            laugh_count,
            think_count,
            sad_count,
            fire_count,
            total_reactions,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Most recently reacted first
        .limit(RECENT_REACTIONS_LIMIT);

      if (error) {
        console.error('Error fetching recently reacted echoes:', error);
        toast.error('Failed to load recent reactions');
        return;
      }

      // Transform the data to flatten the structure
      const transformedData = data?.map(item => ({
        id: item.echoes.id,
        content: item.echoes.content,
        like_count: item.echoes.like_count,
        love_count: item.echoes.love_count,
        laugh_count: item.echoes.laugh_count,
        think_count: item.echoes.think_count,
        sad_count: item.echoes.sad_count,
        fire_count: item.echoes.fire_count,
        total_reactions: item.echoes.total_reactions,
        created_at: item.echoes.created_at,
        reaction_type: item.reaction_type as ReactionType,
        reaction_created_at: item.created_at,
      })) || [];

      setReactedEchoes(transformedData);
    } catch (error: any) {
      console.error('Error in fetchReactedEchoes:', error);
      toast.error('An error occurred while loading recent reactions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveReaction = async (echoId: string, reactionType: ReactionType) => {
    if (!user?.id) return;

    const reactionKey = `${echoId}-${reactionType}`;
    setRemovingIds(prev => new Set(prev).add(reactionKey));
    try {
      const { error } = await supabase.rpc(
        'toggle_echo_reaction',
        { p_echo_id: echoId, p_user_id: user.id, p_reaction_type: reactionType }
      );

      if (error) {
        console.error('Error removing reaction:', error);
        toast.error('Failed to remove reaction');
        return;
      }

      // Remove the reaction from the list
      setReactedEchoes(prev => prev.filter(echo => !(echo.id === echoId && echo.reaction_type === reactionType)));
      toast.success('Reaction removed');
      
      // Call the optional callback (for legacy compatibility)
      if (reactionType === 'like') {
        onUnlike?.(echoId);
      }
    } catch (error: any) {
      console.error('Error in handleRemoveReaction:', error);
      toast.error('An error occurred while removing reaction');
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(reactionKey);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="relative">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        </div>
        <p className="text-gray-400 mt-4 text-sm">Loading your reactions...</p>
      </div>
    );
  }

  if (reactedEchoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-white/5 rounded-2xl mb-3">
          <Heart className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">
          No Recent Reactions
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your recently reacted echoes will appear here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-500/70">
        <div className="space-y-3">
          {reactedEchoes.map((echo) => {
            const reactionConfig = REACTION_CONFIGS.find(config => config.type === echo.reaction_type);
            const reactionKey = `${echo.id}-${echo.reaction_type}`;
            const isRemoving = removingIds.has(reactionKey);
            
            return (
              <div key={reactionKey} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
                <Card className="relative bg-slate-900/50 backdrop-blur-sm border-slate-600/30 rounded-xl hover:border-slate-500/50 transition-all duration-200">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></div>
                      <CardDescription className="text-gray-400 text-xs">
                        {new Date(echo.reaction_created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: new Date(echo.reaction_created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveReaction(echo.id, echo.reaction_type)}
                      disabled={isRemoving}
                      className={`flex items-center space-x-1.5 hover:bg-red-500/10 h-7 px-2 rounded-lg transition-all duration-200 ${reactionConfig?.color || 'text-gray-400'}`}
                    >
                      {isRemoving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span className="text-sm">{reactionConfig?.emoji || '❓'}</span>
                      )}
                      <span className="text-xs font-medium">
                        {echo[`${echo.reaction_type}_count` as keyof ReactedEcho] as number}
                      </span>
                    </Button>
                  </CardHeader>
                  <CardContent className="pt-0 px-3 pb-3">
                    <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                      {echo.content}
                    </p>
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        Echo #{echo.id.slice(0, 8)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {echo.total_reactions} total reactions
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      
      {reactedEchoes.length > 0 && (
        <div className="text-center pt-3 border-t border-slate-700/50 flex-shrink-0">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Heart className="w-3 h-3 text-pink-400" />
            <span className="text-xs text-gray-400 font-medium">
              {reactedEchoes.length} recent {reactedEchoes.length === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 