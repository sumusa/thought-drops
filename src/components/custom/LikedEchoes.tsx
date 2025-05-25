import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquareQuote, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LikedEcho {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
}

interface LikedEchoesProps {
  user: any;
  onUnlike?: (echoId: string) => void;
  refreshTrigger?: number;
}

const RECENT_LIKED_LIMIT = 20;

export function LikedEchoes({ user, onUnlike, refreshTrigger }: LikedEchoesProps) {
  const [likedEchoes, setLikedEchoes] = useState<LikedEcho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlikingIds, setUnlikingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      fetchLikedEchoes();
    }
  }, [user?.id, refreshTrigger]);

  const fetchLikedEchoes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch the most recently liked echoes (last 5)
      const { data, error } = await supabase
        .from('user_echo_likes')
        .select(`
          echo_id,
          created_at,
          echoes (
            id,
            content,
            likes_count,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }) // Most recently liked first
        .limit(RECENT_LIKED_LIMIT);

      if (error) {
        console.error('Error fetching recently liked echoes:', error);
        toast.error('Failed to load recently liked echoes');
        return;
      }

      // Transform the data to flatten the structure
      const transformedData = data?.map(item => ({
        id: item.echoes.id,
        content: item.echoes.content,
        likes_count: item.echoes.likes_count,
        created_at: item.echoes.created_at,
      })) || [];

      setLikedEchoes(transformedData);
    } catch (error: any) {
      console.error('Error in fetchLikedEchoes:', error);
      toast.error('An error occurred while loading recently liked echoes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlike = async (echoId: string) => {
    if (!user?.id) return;

    setUnlikingIds(prev => new Set(prev).add(echoId));
    try {
      const { error } = await supabase.rpc(
        'toggle_like_echo',
        { p_echo_id: echoId, p_user_id: user.id }
      );

      if (error) {
        console.error('Error unliking echo:', error);
        toast.error('Failed to unlike echo');
        return;
      }

      // Remove the echo from the liked list
      setLikedEchoes(prev => prev.filter(echo => echo.id !== echoId));
      toast.success('Echo unliked');
      
      // Call the optional callback
      onUnlike?.(echoId);
    } catch (error: any) {
      console.error('Error in handleUnlike:', error);
      toast.error('An error occurred while unliking');
    } finally {
      setUnlikingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(echoId);
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
        <p className="text-gray-400 mt-4 text-sm">Loading your echoes...</p>
      </div>
    );
  }

  if (likedEchoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <div className="p-3 bg-white/5 rounded-2xl mb-3">
          <Heart className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-white mb-2">
          No Recent Likes
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your recently liked echoes will appear here for quick access.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600/50 scrollbar-track-transparent hover:scrollbar-thumb-slate-500/70">
        <div className="space-y-3">
          {likedEchoes.map((echo) => (
            <div key={echo.id} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <Card className="relative bg-slate-900/50 backdrop-blur-sm border-slate-600/30 rounded-xl hover:border-slate-500/50 transition-all duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-3 px-4 pt-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></div>
                    <CardDescription className="text-gray-400 text-xs">
                      {new Date(echo.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: new Date(echo.created_at).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                      })}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlike(echo.id)}
                    disabled={unlikingIds.has(echo.id)}
                    className="flex items-center space-x-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 rounded-lg transition-all duration-200"
                  >
                    {unlikingIds.has(echo.id) ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Heart className="w-3 h-3 fill-red-500" />
                    )}
                    <span className="text-xs font-medium">{echo.likes_count}</span>
                  </Button>
                </CardHeader>
                <CardContent className="pt-0 px-4 pb-4">
                  <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                    {echo.content}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="text-xs text-gray-500">
                      Echo #{echo.id.slice(0, 8)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      
      {likedEchoes.length > 0 && (
        <div className="text-center pt-3 border-t border-slate-700/50 flex-shrink-0">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
            <Heart className="w-3 h-3 text-pink-400" />
            <span className="text-xs text-gray-400 font-medium">
              {likedEchoes.length} recent {likedEchoes.length === 1 ? 'echo' : 'echoes'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
} 