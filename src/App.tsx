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
import { Heart, Sparkles, Wind, MessageSquareQuote } from 'lucide-react'; // Import Heart, Sparkles, and Wind icons, and MessageSquareQuote
import { EmptyEchoState } from '@/components/custom/EmptyEchoState'; // Import new component

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
  const [hasAttemptedCatch, setHasAttemptedCatch] = useState(false); // New state

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
    setHasAttemptedCatch(false); // Reset before new attempt

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
        // No need to set isCatching(false) here, it's handled in the finally block or after try-catch
        return; 
      }

      // rpcData should be an array. It could be empty if no unseen echoes are found.
      if (rpcData && rpcData.length > 0) {
        const actualEcho: Echo = rpcData[0]; // Get the first (and only) echo from the array
        
        setCaughtEcho(actualEcho);

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
        toast.info("No new echoes available to catch right now. Try again later or submit one!");
        // No echo caught, setCaughtEcho(null) is already done
      }
    } catch (error: any) {
      console.error("Error in handleCatchEcho:", error);
      toast.error(`An error occurred: ${error.message}. Please try again.`);
      // Ensure caughtEcho remains null on error
      setCaughtEcho(null);
    } finally {
      setIsCatching(false);
      setHasAttemptedCatch(true); // Mark that an attempt was made
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

  if (authLoading) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <Toaster richColors closeButton />
        <p className="text-lg">Initializing session...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground">
      <Toaster richColors closeButton />
      <div className="w-full max-w-md">
        <header 
          className="text-center mb-12 p-6 bg-dark-surface rounded-xl shadow-md border border-dark-border"
        >
          {user && <p className="text-xs text-dark-text-subtle mb-2">User ID: {user.id}</p>}
          <div className="flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-dark-accent mr-3" />
            <h1 className="text-4xl font-bold tracking-tight text-gradient-pink-cyan sm:text-5xl">
              Ephemeral Echoes
            </h1>
          </div>
          <p className="mt-3 text-lg text-dark-text-subtle sm:mt-4">
            Drop a thought. Catch a whisper.
          </p>
        </header>
        
        <section className="flex justify-center mb-12">
          <EchoSubmitForm />
        </section>

        <section className="flex flex-col items-center mb-12">
          <h2 className="text-3xl font-semibold mb-6 text-dark-text-primary">Discover an Echo</h2>
          <Button 
            onClick={handleCatchEcho} 
            disabled={isCatching || !user} 
            size="lg"
            className="bg-dark-accent hover:bg-cyan-500 text-dark-bg font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 ease-in-out hover:scale-105 flex items-center space-x-2"
          >
            <Wind className="w-5 h-5" />
            <span>
              {isCatching ? "Searching..." : "Catch an Echo"}
            </span>
          </Button>

          {caughtEcho && (
            <Card className="mt-8 text-left animate-fadeIn rounded-xl shadow-lg bg-dark-surface border-dark-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-dark-text-primary">An Echo Resonates...</CardTitle>
                  <CardDescription className="text-dark-text-subtle">A previously unseen thought, just for you.</CardDescription>
                </div>
                <MessageSquareQuote className="w-8 h-8 text-dark-text-subtle opacity-50" />
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed whitespace-pre-wrap text-dark-text-primary">
                  {caughtEcho.content}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLikeToggle(caughtEcho.id)}
                    disabled={isLiking || !user}
                    className="flex items-center space-x-1.5 group text-dark-text-subtle"
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
          )}

          {!isCatching && !caughtEcho && hasAttemptedCatch && (
            <EmptyEchoState />
          )}

        </section>
      </div>
    </main>
  )
}

export default App
