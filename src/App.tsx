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
import { Heart, Sparkles, Wind, MessageSquareQuote, Loader2 } from 'lucide-react'; // Import Heart, Sparkles, and Wind icons, and MessageSquareQuote and Loader2
import { EmptyEchoState, type NoEchoReason } from '@/components/custom/EmptyEchoState'; // Import NoEchoReason from EmptyEchoState
import { LikedEchoes } from '@/components/custom/LikedEchoes';

interface Echo {
  id: string;
  content: string;
  likes_count: number;
  is_liked_by_user: boolean;
}

function App() {
  const [user, setUser] = useState<any | null>(null); // Temporarily using any for user type
  const [authLoading, setAuthLoading] = useState(true); // Initialize as true

  const [caughtEcho, setCaughtEcho] = useState<Echo | null>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [isLiking, setIsLiking] = useState(false); // For disabling like button during RPC call
  const [noEchoReason, setNoEchoReason] = useState<NoEchoReason>('initial'); // New state, initial as 'initial'

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

  const handleCatchEcho = async () => {
    if (!user || !user.id) {
        toast.info("Authenticating... Please try again in a moment.");
        return;
    }
    setIsCatching(true);
    setCaughtEcho(null);
    setNoEchoReason('loading'); // Set reason to loading

    try {
      // Call the Supabase database function
      // It returns an array of objects: { data: [{id, content}], error }
      // or { data: [], error } if no rows are found.
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_random_unseen_echo',
        { p_user_id: user.id }
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
        const actualEcho: Echo = rpcData[0]; // Get the first (and only) echo from the array
        
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
        
        toast.info("No new echoes available to catch right now. Try again later or submit one!");
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

  const handleLikeToggle = async (echoId: string) => {
    if (!user || !user.id) {
      toast.error("You must be signed in to like an echo.");
      return;
    }
    if (!caughtEcho || caughtEcho.id !== echoId) return; // Safety check

    setIsLiking(true);
    try {
      const { data: likeResult, error: likeError } = await supabase.rpc(
        'toggle_like_echo',
        { p_echo_id: echoId, p_user_id: user.id }
      );

      if (likeError) {
        console.error("Error toggling like:", likeError);
        toast.error(`Failed to update like: ${likeError.message}`);
        return;
      }

      // The RPC function returns an array with one object: [{ is_liked, new_likes_count }]
      if (likeResult && likeResult.length > 0) {
        const { is_liked, new_likes_count } = likeResult[0];
        setCaughtEcho(prevEcho => {
          if (!prevEcho || prevEcho.id !== echoId) return prevEcho;
          return {
            ...prevEcho,
            is_liked_by_user: is_liked,
            likes_count: new_likes_count,
          };
        });
        toast.success(is_liked ? "Echo liked!" : "Like removed.");
      } else {
        toast.error("Could not confirm like status change.");
      }

    } catch (error: any) {
      console.error("Error in handleLikeToggle:", error);
      toast.error(`An error occurred: ${error.message}`);
    } finally {
      setIsLiking(false);
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

  if (authLoading) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <Toaster richColors closeButton />
        <p className="text-lg">Initializing session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Toaster richColors closeButton />
      
      {/* Header spanning full width */}
      <header className="w-full bg-dark-surface border-b border-dark-border shadow-sm">
        <div className="container mx-auto px-6 py-6">
          {user && <p className="text-xs text-dark-text-subtle mb-3">User ID: {user.id}</p>}
          <div className="flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-dark-accent mr-3" />
            <h1 className="text-4xl font-bold tracking-tight text-gradient-pink-cyan sm:text-5xl">
              Ephemeral Echoes
            </h1>
          </div>
          <p className="mt-3 text-lg text-dark-text-subtle text-center sm:mt-4">
            Drop a thought. Catch a whisper.
          </p>
        </div>
      </header>

      {/* Main content area with sidebar layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[calc(100vh-200px)]">
          
          {/* Main content area - takes up 2/3 on large screens */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Echo submission section */}
            <section className="flex justify-center">
              <EchoSubmitForm />
            </section>

            {/* Discover echoes section */}
            <section className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl font-semibold text-dark-text-primary mb-2">Discover an Echo</h2>
                <p className="text-dark-text-subtle">Find thoughts from other anonymous minds</p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={handleCatchEcho} 
                  disabled={isCatching || !user} 
                  size="lg"
                  className="bg-dark-accent hover:bg-cyan-500 text-dark-bg font-semibold py-4 px-8 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 ease-in-out hover:scale-105 flex items-center space-x-3 min-w-[220px] justify-center"
                >
                  {isCatching ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Wind className="w-6 h-6" />
                  )}
                  <span className="text-lg">
                    {isCatching ? "Searching..." : "Catch an Echo"}
                  </span>
                </Button>
              </div>

              {/* Conditional rendering for EmptyEchoState or caughtEcho */}
              {!isCatching && !caughtEcho && noEchoReason !== 'loading' && noEchoReason !== null && noEchoReason !== 'initial' && (
                <div className="flex justify-center">
                  <div className="w-full max-w-2xl">
                    <EmptyEchoState reason={noEchoReason} />
                  </div>
                </div>
              )}

              {caughtEcho && (
                <div className="flex justify-center">
                  <Card className="w-full max-w-2xl text-left animate-fadeIn rounded-xl shadow-lg bg-dark-surface border-dark-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-dark-text-primary text-xl">An Echo Resonates...</CardTitle>
                        <CardDescription className="text-dark-text-subtle">A previously unseen thought, just for you.</CardDescription>
                      </div>
                      <MessageSquareQuote className="w-8 h-8 text-dark-text-subtle opacity-50" />
                    </CardHeader>
                    <CardContent>
                      <p className="text-lg leading-relaxed whitespace-pre-wrap text-dark-text-primary mb-6">
                        {caughtEcho.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleLikeToggle(caughtEcho.id)}
                          disabled={isLiking || !user}
                          className="flex items-center space-x-2 group text-dark-text-subtle hover:text-red-400"
                        >
                          <Heart 
                            className={`w-5 h-5 group-hover:fill-red-500 group-hover:text-red-500 transition-colors ${caughtEcho.is_liked_by_user ? 'fill-red-500 text-red-500' : ''}`}
                          />
                          <span className={`text-sm font-medium ${caughtEcho.is_liked_by_user ? 'text-red-400' : ''}`}>
                            {caughtEcho.likes_count} {caughtEcho.likes_count === 1 ? 'Like' : 'Likes'}
                          </span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar for liked echoes - takes up 1/3 on large screens */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-dark-surface rounded-xl border border-dark-border p-6 shadow-lg">
                <div className="flex items-center space-x-2 mb-6">
                  <Heart className="w-6 h-6 text-dark-accent" />
                  <h3 className="text-xl font-semibold text-dark-text-primary">Your Liked Echoes</h3>
                </div>
                <LikedEchoes user={user} onUnlike={handleUnlikeFromLikedList} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
