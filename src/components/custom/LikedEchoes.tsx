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
}

export function LikedEchoes({ user, onUnlike }: LikedEchoesProps) {
  const [likedEchoes, setLikedEchoes] = useState<LikedEcho[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlikingIds, setUnlikingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.id) {
      fetchLikedEchoes();
    }
  }, [user?.id]);

  const fetchLikedEchoes = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch echoes that the user has liked
      const { data, error } = await supabase
        .from('user_echo_likes')
        .select(`
          echo_id,
          echoes (
            id,
            content,
            likes_count,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching liked echoes:', error);
        toast.error('Failed to load liked echoes');
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
      toast.error('An error occurred while loading liked echoes');
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
        <Loader2 className="w-8 h-8 animate-spin text-dark-accent mb-4" />
        <p className="text-dark-text-subtle">Loading your liked echoes...</p>
      </div>
    );
  }

  if (likedEchoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Heart className="w-12 h-12 text-dark-text-subtle opacity-50 mb-4" />
        <h3 className="text-xl font-semibold text-dark-text-primary mb-2">
          No Liked Echoes Yet
        </h3>
        <p className="text-dark-text-subtle">
          When you like an echo, it will appear here for you to revisit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
        {likedEchoes.map((echo) => (
          <Card key={echo.id} className="bg-dark-bg border-dark-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 px-4 pt-3">
              <div className="flex items-center space-x-2">
                <MessageSquareQuote className="w-4 h-4 text-dark-text-subtle opacity-50" />
                <CardDescription className="text-dark-text-subtle text-xs">
                  {new Date(echo.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnlike(echo.id)}
                disabled={unlikingIds.has(echo.id)}
                className="flex items-center space-x-1 text-red-400 hover:text-red-300 h-6 px-2"
              >
                {unlikingIds.has(echo.id) ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Heart className="w-3 h-3 fill-red-500" />
                )}
                <span className="text-xs">{echo.likes_count}</span>
              </Button>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-3">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-dark-text-primary">
                {echo.content}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {likedEchoes.length > 0 && (
        <div className="text-center pt-2 border-t border-dark-border">
          <span className="text-xs text-dark-text-subtle">
            {likedEchoes.length} {likedEchoes.length === 1 ? 'echo' : 'echoes'} liked
          </span>
        </div>
      )}
    </div>
  );
} 