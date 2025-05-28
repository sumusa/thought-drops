import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Heart, 
  Eye, 
  Trophy,
  Sparkles,
  ArrowLeft,
  Loader2,
  MessageSquareQuote
} from 'lucide-react';
import { toast } from 'sonner';
import { REACTION_CONFIGS } from '@/types/reactions';
import { EchoSubmitForm } from '@/components/custom/EchoSubmitForm';
import type { UserEcho, UserEchoStats } from '@/types/history';

interface PersonalEchoHistoryProps {
  user: any;
  onBack: () => void;
}

const ECHOES_PER_PAGE = 10;

export function PersonalEchoHistory({ user, onBack }: PersonalEchoHistoryProps) {
  const [userEchoes, setUserEchoes] = useState<UserEcho[]>([]);
  const [userStats, setUserStats] = useState<UserEchoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedEcho, setSelectedEcho] = useState<UserEcho | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreEchoes, setHasMoreEchoes] = useState(true);
  const [totalEchoes, setTotalEchoes] = useState(0);


  useEffect(() => {
    if (user?.id) {
      fetchUserHistory();
    }
  }, [user?.id]);

  const fetchUserHistory = async (page = 1, append = false) => {
    if (!user?.id) return;

    try {
      if (!append) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      // Calculate offset for pagination
      const offset = (page - 1) * ECHOES_PER_PAGE;

      // Fetch user's echo history with pagination
      const { data: historyData, error: historyError } = await supabase.rpc(
        'get_user_echo_history_paginated',
        { 
          p_user_id: user.id,
          p_limit: ECHOES_PER_PAGE,
          p_offset: offset
        }
      );

      if (historyError) {
        console.error('Error fetching echo history:', historyError);
        toast.error('Failed to load your echo history');
        return;
      }

      // Fetch user's echo statistics (only on first load)
      if (!append) {
        const { data: statsData, error: statsError } = await supabase.rpc(
          'get_user_echo_stats',
          { p_user_id: user.id }
        );

        if (statsError) {
          console.error('Error fetching echo stats:', statsError);
          toast.error('Failed to load your echo statistics');
          return;
        }

        setUserStats(statsData?.[0] || null);
        setTotalEchoes(statsData?.[0]?.total_echoes || 0);
      }

      const newEchoes = historyData || [];
      
      if (append) {
        setUserEchoes(prev => [...prev, ...newEchoes]);
      } else {
        setUserEchoes(newEchoes);
      }

      // Check if there are more echoes to load
      setHasMoreEchoes(newEchoes.length === ECHOES_PER_PAGE);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error in fetchUserHistory:', error);
      toast.error('An error occurred while loading your history');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMoreEchoes = () => {
    if (!isLoadingMore && hasMoreEchoes) {
      fetchUserHistory(currentPage + 1, true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReactionBreakdown = (echo: UserEcho) => {
    const reactions = [
      { type: 'like', count: echo.like_count },
      { type: 'love', count: echo.love_count },
      { type: 'laugh', count: echo.laugh_count },
      { type: 'think', count: echo.think_count },
      { type: 'sad', count: echo.sad_count },
      { type: 'fire', count: echo.fire_count },
    ].filter(r => r.count > 0);

    return reactions;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
          <p className="text-gray-300">Loading your echo history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={onBack}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Echoes
              </Button>
              <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <p className="text-xs text-gray-300">Session: {user.id.slice(0, 8)}...</p>
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-3">
                <div className="p-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl shadow-lg">
                  <History className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
                Your Echo Journey
              </h1>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed">
                Explore your anonymous contributions to the digital ether and see how they've resonated with others.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        {userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <MessageSquareQuote className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-white text-lg">Total Echoes</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-cyan-400">{userStats.total_echoes}</div>
                <p className="text-sm text-gray-400 mt-1">Thoughts shared</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <CardTitle className="text-white text-lg">Total Reactions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-pink-400">{userStats.total_reactions_received}</div>
                <p className="text-sm text-gray-400 mt-1">Hearts touched</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <CardTitle className="text-white text-lg">Best Echo</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-400">{userStats.most_popular_echo_reactions}</div>
                <p className="text-sm text-gray-400 mt-1">Most reactions</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{userStats.favorite_mood_emoji}</span>
                  <CardTitle className="text-white text-lg">Favorite Mood</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold text-purple-400 capitalize">{userStats.favorite_mood}</div>
                <p className="text-sm text-gray-400 mt-1">Most used mood</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Echo History */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">Your Echo History</h2>
              <div className="text-sm text-gray-400">({userEchoes.length} of {totalEchoes} echoes)</div>
            </div>
            {userEchoes.length > 0 && (
              <div className="flex-shrink-0">
                <EchoSubmitForm onEchoSubmitted={fetchUserHistory} compact={true} />
              </div>
            )}
          </div>

          {userEchoes.length === 0 ? (
            <Card className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50">
              <CardContent className="text-center py-12">
                <MessageSquareQuote className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Echoes Yet</h3>
                <p className="text-gray-400 mb-6">
                  You haven't submitted any echoes yet. Start sharing your thoughts with the world!
                </p>
                <div className="flex justify-center">
                  <EchoSubmitForm onEchoSubmitted={fetchUserHistory} compact={true} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {userEchoes.map((echo) => (
                <Card 
                  key={echo.id} 
                  className="bg-slate-800/90 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all duration-200 cursor-pointer"
                  onClick={() => setSelectedEcho(selectedEcho?.id === echo.id ? null : echo)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"></div>
                          <CardTitle className="text-white text-lg">
                            Echo from {formatDate(echo.created_at)}
                          </CardTitle>
                          {echo.mood_emoji && (
                            <span className="text-lg" title={echo.mood_name || 'Unknown mood'}>
                              {echo.mood_emoji}
                            </span>
                          )}
                        </div>
                        <CardDescription className="text-gray-400">
                          {echo.mood_name ? (
                            <span>
                              A <span className={`capitalize ${echo.mood_color}`}>{echo.mood_name}</span> echo
                            </span>
                          ) : (
                            "An echo from your thoughts"
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{echo.total_reactions}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{echo.times_seen}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">
                        {echo.content}
                      </p>
                    </div>

                    {selectedEcho?.id === echo.id && (
                      <div className="space-y-4 border-t border-slate-600/50 pt-4">
                        <h4 className="text-sm font-semibold text-gray-300">Engagement Breakdown</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {getReactionBreakdown(echo).map(({ type, count }) => {
                            const config = REACTION_CONFIGS.find(c => c.type === type);
                            if (!config) return null;
                            return (
                              <div 
                                key={type}
                                className="flex items-center space-x-2 p-2 bg-slate-700/50 rounded-lg"
                              >
                                <span className="text-lg">{config.emoji}</span>
                                <span className="text-sm text-gray-300">{config.label}</span>
                                <span className="text-sm font-semibold text-white ml-auto">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                          <span>Echo ID: {echo.id.slice(0, 8)}...</span>
                          <span>Seen by {echo.times_seen} people</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                              ))}
              
              {/* Load More Button */}
              {hasMoreEchoes && (
                <div className="flex justify-center pt-8">
                  <Button
                    onClick={loadMoreEchoes}
                    disabled={isLoadingMore}
                    className="bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50 hover:border-slate-500/50 px-8 py-3 rounded-xl transition-all duration-200"
                  >
                    {isLoadingMore ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Loading more echoes...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Load More Echoes</span>
                      </div>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 