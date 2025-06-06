import './index.css'
import { EchoSubmitForm } from '@/components/custom/EchoSubmitForm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient";
import { useState, useEffect } from 'react'
// import { User } from '@supabase/supabase-js'; // Temporarily commented out due to import issues
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Heart, Sparkles, Wind, MessageSquareQuote, Loader2, History } from 'lucide-react'; // Import Heart, Sparkles, and Wind icons, and MessageSquareQuote and Loader2
import { EmptyEchoState, type NoEchoReason } from '@/components/custom/EmptyEchoState'; // Import NoEchoReason from EmptyEchoState
import { LikedEchoes } from '@/components/custom/LikedEchoes';
import { EchoReactions } from '@/components/EchoReactions';
import { MoodSelector } from '@/components/MoodSelector';
import { PersonalEchoHistory } from '@/components/PersonalEchoHistory';
import { EchoThread } from '@/components/EchoThread';
import { Footer } from '@/components/Footer';
import type { EchoWithReactions } from '@/types/reactions';
import type { EchoMood, EchoWithMood } from '@/types/moods';

interface Echo extends EchoWithReactions, EchoWithMood {
  // Legacy compatibility - keeping old interface for now
  likes_count: number;
  is_liked_by_user: boolean;
  reply_count: number;
}

function App() {
  const [user, setUser] = useState<any | null>(null); // Temporarily using any for user type
  const [authLoading, setAuthLoading] = useState(true); // Initialize as true

  const [caughtEcho, setCaughtEcho] = useState<Echo | null>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [noEchoReason, setNoEchoReason] = useState<NoEchoReason>('initial'); // New state, initial as 'initial'
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<EchoMood | null>(null);
  const [currentView, setCurrentView] = useState<'main' | 'history'>('main');
  const [showThread, setShowThread] = useState(false);

  // Add ref to trigger liked echoes refresh
  const [likedEchoesRefreshTrigger, setLikedEchoesRefreshTrigger] = useState(0);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth state changed:", _event, session?.user?.id);

        if (session?.user) {
          setUser(session.user);
          setAuthLoading(false);
        } else {
          // No session.user, attempt anonymous sign-in if we don't have a user yet
          // and this isn't a SIGNED_IN event that failed to provide a user.
          if (!user && _event !== 'SIGNED_IN') {
            console.log("No current user and event is not SIGNED_IN, attempting anonymous sign-in...");
            const { error: anonError } = await supabase.auth.signInAnonymously(); // anonSession removed
            if (anonError) {
              console.error("Error signing in anonymously:", anonError);
              toast.error("Could not start an anonymous session. Please try refreshing.");
              setUser(null); // Explicitly set user to null on error
              setAuthLoading(false); // Stop loading, sign-in failed
            } else {
              // Successfully called signInAnonymously.
              // onAuthStateChange will fire again with _event 'SIGNED_IN' and the new session.
              // setUser and setAuthLoading(false) will be handled by that subsequent event.
              console.log("Initiated anonymous sign-in. Waiting for onAuthStateChange with SIGNED_IN.");
            }
          } else {
            // Conditions for automatic anonymous sign-in not met (e.g., user already exists then signed out, or it was a SIGNED_IN event).
            // If no session.user at this point, ensure user state is null and stop loading.
            if (!session?.user) {
                setUser(null);
            }
            setAuthLoading(false);
          }
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []); // Reverted dependency array to empty

  // Add URL hash navigation for persistent view state
  useEffect(() => {
    // Read initial view from URL hash
    const hash = window.location.hash.slice(1); // Remove the #
    if (hash === 'history') {
      setCurrentView('history');
    }
    
    // Listen for hash changes
    const handleHashChange = () => {
      const newHash = window.location.hash.slice(1);
      if (newHash === 'history') {
        setCurrentView('history');
      } else {
        setCurrentView('main');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update URL when view changes
  const handleViewChange = (view: 'main' | 'history') => {
    setCurrentView(view);
    if (view === 'history') {
      window.history.pushState(null, '', '#history');
    } else {
      window.history.pushState(null, '', '#');
    }
  };

  const handleCatchEcho = async () => {
    if (!user || !user.id) {
        toast.info("Authenticating... Please try again in a moment.");
        return;
    }
    setIsCatching(true);
    setCaughtEcho(null);
    setNoEchoReason('loading'); // Set reason to loading

    try {
      // Call the Supabase database function with reactions support
      // It returns an array of objects with reaction data
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_random_unseen_echo_with_reactions',
        { 
          p_user_id: user.id,
          p_mood_filter: selectedMoodFilter?.id || null
        }
      );

      if (rpcError) {
        // For a function that RETURNS TABLE, an empty result is typically an empty array in `data`,
        // not an rpcError. So, if rpcError exists, it's likely a genuine problem.
        console.error("Error calling get_random_unseen_echo:", rpcError);
        toast.error(`Failed to fetch an echo: ${rpcError.message}. Please try again.`);
        setNoEchoReason('error');
        return; 
      }

      // rpcData should be an array. It could be empty if no unseen echoes are found.
      if (rpcData && rpcData.length > 0) {
        const echoData = rpcData[0];
        // Add legacy compatibility fields
        const actualEcho: Echo = {
          ...echoData,
          likes_count: echoData.like_count, // Legacy compatibility
          is_liked_by_user: echoData.user_like_reaction // Legacy compatibility
        };
        
        setCaughtEcho(actualEcho);
        setNoEchoReason(null); // Successfully caught an echo

        // Mark this echo as seen for the current user
        const { error: insertSeenError } = await supabase
          .from('seen_echoes')
          .insert({ user_id: user.id, echo_id: actualEcho.id }); // Use actualEcho.id

        if (insertSeenError) {
          console.error("Error marking echo as seen:", insertSeenError);
          toast.warning(`Could not save this echo as seen: ${insertSeenError.message}. You might see it again.`);
          // Echo is already displayed, so user sees it. The warning is for future catches.
        }
      } else {
        // This case handles rpcData being null, undefined, or an empty array (no new echoes).
        // We can't easily distinguish "no echoes at all" vs "user has seen all" with the current RPC.
        // So we use a generic "no_new_echoes" or check if any echoes exist at all.
        // For a more precise "all_seen" message, we might need another query or RPC modification.
        
        const { count, error: countError } = await supabase
            .from('echoes')
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error("Error counting total echoes:", countError);
            setNoEchoReason('no_new_echoes'); // Fallback
        } else if (count === 0) {
            setNoEchoReason('no_new_echoes'); // No echoes in the system at all
        } else {
            setNoEchoReason('all_seen'); // Echoes exist, but user has seen them all
        }
        
        toast.info("You've discovered all the echoes for now ✨ Why not share your own thoughts?");
      }
    } catch (error: any) {
      console.error("Error in handleCatchEcho:", error);
      toast.error(`An error occurred: ${error.message}. Please try again.`);
      setNoEchoReason('error');
      setCaughtEcho(null);
    } finally {
      setIsCatching(false);
    }
  };


  const handleUnlikeFromLikedList = (echoId: string) => {
    // If the currently caught echo was unliked from the liked list, update its state
    if (caughtEcho && caughtEcho.id === echoId) {
      setCaughtEcho(prev => prev ? {
        ...prev,
        is_liked_by_user: false,
        likes_count: Math.max(0, prev.likes_count - 1)
      } : null);
    }
  };

  const handleRefreshCurrentEcho = async () => {
    if (!caughtEcho || !user?.id) return;
    
    try {
      // Fetch updated echo data
      const { data: echoData, error } = await supabase
        .from('echoes')
        .select(`
          id,
          content,
          mood_id,
          like_count,
          love_count,
          laugh_count,
          think_count,
          sad_count,
          fire_count,
          total_reactions,
          reply_count
        `)
        .eq('id', caughtEcho.id)
        .single();

      if (error) {
        console.error('Error refreshing echo:', error);
        return;
      }

      // Fetch user's reactions for this echo
      const { data: userReactions, error: reactionsError } = await supabase
        .from('echo_reactions')
        .select('reaction_type')
        .eq('user_id', user.id)
        .eq('echo_id', caughtEcho.id);

      if (reactionsError) {
        console.error('Error fetching user reactions:', reactionsError);
        return;
      }

      // Build user reaction flags
      const reactionTypes = userReactions?.map(r => r.reaction_type) || [];
      const updatedEcho = {
        ...echoData,
        user_like_reaction: reactionTypes.includes('like'),
        user_love_reaction: reactionTypes.includes('love'),
        user_laugh_reaction: reactionTypes.includes('laugh'),
        user_think_reaction: reactionTypes.includes('think'),
        user_sad_reaction: reactionTypes.includes('sad'),
        user_fire_reaction: reactionTypes.includes('fire'),
        // Mood properties (will be null if no mood)
        mood_id: echoData.mood_id,
        mood_name: null,
        mood_emoji: null,
        mood_color: null,
        // Legacy compatibility
        likes_count: echoData.like_count,
        is_liked_by_user: reactionTypes.includes('like'),
        reply_count: echoData.reply_count || 0
      };

      setCaughtEcho(updatedEcho);
    } catch (error) {
      console.error('Error in handleRefreshCurrentEcho:', error);
    }
  };

  if (authLoading) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <Toaster richColors closeButton />
        <p className="text-lg">Initializing session...</p>
      </main>
    );
  }

  // Show Personal Echo History if that view is selected
  if (currentView === 'history') {
    return (
      <>
        <Toaster richColors closeButton />
        <PersonalEchoHistory 
          user={user} 
          onBack={() => handleViewChange('main')} 
        />
      </>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <Toaster richColors closeButton />
      
      {/* Modern Header with gradient background */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
        <div className="relative backdrop-blur-sm bg-black/20 border-b border-white/10">
          <div className="container mx-auto px-6 py-4">
            {user && (
              <div className="flex justify-between items-center mb-3">
                <Button
                  variant="ghost"
                  onClick={() => handleViewChange('history')}
                  className="text-gray-300 hover:text-white hover:bg-white/10 flex items-center space-x-2"
                >
                  <History className="w-4 h-4" />
                  <span>My Echo History</span>
                </Button>
                <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <p className="text-xs text-gray-300">Session: {user.id.slice(0, 8)}...</p>
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                Ephemeral Echoes
              </h1>
              <p className="text-base text-gray-300 max-w-2xl mx-auto leading-relaxed mb-4">
                Share anonymous thoughts that drift through the digital ether, 
                waiting to be discovered by kindred spirits.
              </p>
              
              {/* Demo Video Section */}
              <div className="max-w-3xl mx-auto">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 p-6 shadow-xl">
                    <div className="flex items-center justify-center mb-4">
                      <div className="flex items-center space-x-2 text-purple-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Watch Demo</span>
                      </div>
                    </div>
                    
                    {/* Placeholder for Loom video - replace with your actual embed */}
                    <div className="aspect-video bg-slate-900/50 rounded-xl border border-slate-600/30 flex items-center justify-center">
                      <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
      <div>
                          <p className="text-gray-300 font-medium">Demo Video Coming Soon</p>
                          <p className="text-gray-400 text-sm">See Ephemeral Echoes in action</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Replace the above placeholder div with your Loom embed like this:
                    <div className="aspect-video">
                      <iframe
                        src="https://www.loom.com/embed/YOUR_VIDEO_ID"
                        frameBorder="0"
                        allowFullScreen
                        className="w-full h-full rounded-xl"
                      ></iframe>
                    </div>
                    */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area with proper scrolling */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Main content area - takes up 3/4 on xl screens */}
          <div className="xl:col-span-3">
            <div className="space-y-8 pb-6">
              
              {/* Echo submission section with card design */}
              <section className="flex justify-center">
                <div className="w-full max-w-md">
                  <EchoSubmitForm />
                </div>
              </section>

              {/* Discover echoes section with enhanced design */}
              <section className="space-y-6">
                <div className="text-center space-y-4">
                  {/* Section header - not button-like */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <div className="flex items-center space-x-3 text-white">
                        <Wind className="w-5 h-5 text-cyan-400" />
                        <h2 className="text-2xl font-bold">Discover Echoes</h2>
                      </div>
                    </div>
                    <p className="text-gray-400 text-base max-w-lg mx-auto">
                      Catch whispers from anonymous minds across the void
                    </p>
                    <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent mx-auto"></div>
                  </div>

                  {/* Mood Filter */}
                  <div className="max-w-2xl mx-auto">
                    <MoodSelector
                      selectedMood={selectedMoodFilter}
                      onMoodSelect={setSelectedMoodFilter}
                      variant="filter"
                    />
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={handleCatchEcho} 
                    disabled={isCatching || !user} 
                    className="group relative overflow-hidden bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-300 ease-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative flex items-center space-x-2">
                      {isCatching ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Wind className="w-5 h-5" />
                      )}
                      <span className="text-base">
                        {isCatching ? "Searching the void..." : "Catch an Echo"}
                      </span>
                    </div>
                  </Button>
                </div>

                {/* Enhanced empty state */}
                {!isCatching && !caughtEcho && noEchoReason !== 'loading' && noEchoReason !== null && noEchoReason !== 'initial' && (
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <EmptyEchoState reason={noEchoReason} />
                    </div>
                  </div>
                )}

                {/* Enhanced caught echo card */}
                {caughtEcho && (
                  <div className="flex justify-center">
                    <div className="w-full max-w-2xl">
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                        <Card className="relative bg-slate-800/90 backdrop-blur-sm border-slate-700/50 rounded-2xl shadow-2xl">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-pulse"></div>
                                  <CardTitle className="text-white text-xl font-semibold">
                                    An Echo Resonates
                                  </CardTitle>
                                  {caughtEcho.mood_emoji && (
                                    <span className="text-lg" title={caughtEcho.mood_name || 'Unknown mood'}>
                                      {caughtEcho.mood_emoji}
                                    </span>
                                  )}
                                </div>
                                <CardDescription className="text-gray-400">
                                  {caughtEcho.mood_name ? (
                                    <span>
                                      A <span className={`capitalize ${caughtEcho.mood_color}`}>{caughtEcho.mood_name}</span> whisper from the digital ether
                                    </span>
                                  ) : (
                                    "A whisper from the digital ether, meant for you"
                                  )}
                                </CardDescription>
                              </div>
                              <div className="p-2 bg-white/5 rounded-lg">
                                <MessageSquareQuote className="w-6 h-6 text-gray-400" />
                              </div>
      </div>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-lg leading-relaxed text-gray-100 whitespace-pre-wrap">
                                {caughtEcho.content}
                              </p>
                            </div>
                            <div className="space-y-4">
                              <EchoReactions
                                echoId={caughtEcho.id}
                                userId={user?.id || ''}
                                reactions={{
                                  like_count: caughtEcho.like_count,
                                  love_count: caughtEcho.love_count,
                                  laugh_count: caughtEcho.laugh_count,
                                  think_count: caughtEcho.think_count,
                                  sad_count: caughtEcho.sad_count,
                                  fire_count: caughtEcho.fire_count,
                                }}
                                userReactions={{
                                  user_like_reaction: caughtEcho.user_like_reaction,
                                  user_love_reaction: caughtEcho.user_love_reaction,
                                  user_laugh_reaction: caughtEcho.user_laugh_reaction,
                                  user_think_reaction: caughtEcho.user_think_reaction,
                                  user_sad_reaction: caughtEcho.user_sad_reaction,
                                  user_fire_reaction: caughtEcho.user_fire_reaction,
                                }}
                                onReactionChange={() => {
                                  // Refresh the sidebar
                                  setLikedEchoesRefreshTrigger(prev => prev + 1);
                                  // The EchoReactions component will handle updating its own state
                                  // We'll need to re-fetch the echo to get updated counts
                                  handleRefreshCurrentEcho();
                                }}
                              />
                              <div className="flex justify-between items-center pt-2">
                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                  <span>{caughtEcho.total_reactions} total reactions</span>
                                  <span>{caughtEcho.reply_count} {caughtEcho.reply_count === 1 ? 'reply' : 'replies'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowThread(true)}
                                    className="text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 text-xs"
                                  >
                                    💬 View Thread
                                  </Button>
                                  <div className="text-xs text-gray-500">
                                    Echo #{caughtEcho.id.slice(0, 8)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </section>
              </div>
            </div>

          {/* Enhanced sidebar for liked echoes - responsive height */}
          <div className="xl:col-span-1 flex flex-col">
            <div className="relative group h-fit max-h-[calc(100vh-12rem)] flex flex-col">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl flex flex-col h-full">
                <div className="flex items-center space-x-3 mb-6 flex-shrink-0">
                  <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Recent Reactions</h3>
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <LikedEchoes 
                    user={user} 
                    onUnlike={handleUnlikeFromLikedList}
                    refreshTrigger={likedEchoesRefreshTrigger}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Echo Thread Modal */}
      {showThread && caughtEcho && (
        <EchoThread
          echo={caughtEcho as import('src/types/echo').Echo}
          onClose={() => setShowThread(false)}
          onEchoUpdate={handleRefreshCurrentEcho}
        />
      )}

      <Footer />
    </main>
  )
}

export default App
