import './App.css'
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

interface Echo {
  id: string;
  content: string;
}

function App() {
  const [user, setUser] = useState<any | null>(null); // Temporarily using any for user type
  const [authLoading, setAuthLoading] = useState(true);

  const [caughtEcho, setCaughtEcho] = useState<Echo | null>(null);
  const [isCatching, setIsCatching] = useState(false);

  useEffect(() => {
    setAuthLoading(true);
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (!session) {
        const { data: anonSession, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          console.error("Error signing in anonymously:", anonError);
          toast.error("Could not start an anonymous session. Please try refreshing.");
        } else {
          setUser(anonSession?.user ?? null);
          console.log("Signed in anonymously:", anonSession?.user);
        }
      } 
      setAuthLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (_event !== 'INITIAL_SESSION') {
            setAuthLoading(false);
        }
        console.log("Auth state changed:", _event, session?.user);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleCatchEcho = async () => {
    if (!user || !user.id) {
        toast.info("Authenticating... Please try again in a moment.");
        return;
    }
    setIsCatching(true);
    setCaughtEcho(null);

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
      }
    } catch (error: any) { // Catches errors from the try block, including re-thrown rpcError if logic changes
      console.error("Error in handleCatchEcho:", error);
      toast.error(`An error occurred: ${error.message}. Please try again.`);
    } finally {
      setIsCatching(false); // Ensure this is always called
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
    <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <Toaster richColors closeButton />
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
          {user && <p className="text-xs text-gray-500">User ID: {user.id}</p>}
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-5xl md:text-6xl">
            Ephemeral Echoes
          </h1>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 sm:mt-4">
            Drop a thought. Catch a whisper.
          </p>
        </header>
        
        <section className="flex justify-center mb-12">
          <EchoSubmitForm />
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-semibold mb-6 text-gray-800 dark:text-gray-200">Discover an Echo</h2>
          <Button onClick={handleCatchEcho} disabled={isCatching || !user} size="lg">
            {isCatching ? "Searching for an Echo..." : "Catch an Echo"}
          </Button>

          {caughtEcho && (
            <Card className="mt-8 text-left animate-fadeIn">
              <CardHeader>
                <CardTitle>An Echo Resonates...</CardTitle>
                <CardDescription>A previously unseen thought, just for you.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed whitespace-pre-wrap">{caughtEcho.content}</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
