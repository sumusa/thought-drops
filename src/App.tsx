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

interface Echo {
  id: string;
  content: string;
}

function App() {
  const [user, setUser] = useState<any | null>(null); // Temporarily using any for user type
  const [authLoading, setAuthLoading] = useState(true);

  const [caughtEcho, setCaughtEcho] = useState<Echo | null>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    setAuthLoading(true);
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (!session) {
        const { data: anonSession, error: anonError } = await supabase.auth.signInAnonymously();
        if (anonError) {
          console.error("Error signing in anonymously:", anonError);
          setFeedbackMessage("Could not start an anonymous session. Please try refreshing.");
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
    if (!user || !user.id) { // Ensure user and user.id exist
        setFeedbackMessage("Authenticating... Please try again in a moment.");
        return;
    }
    setIsCatching(true);
    setCaughtEcho(null);
    setFeedbackMessage(null);

    try {
      // Step 1: Get IDs of echoes already seen by the current user
      const { data: seenEchosData, error: seenError } = await supabase
        .from('seen_echoes')
        .select('echo_id')
        .eq('user_id', user.id);

      if (seenError) {
        console.error("Error fetching seen echoes:", seenError);
        throw seenError;
      }

      const seenEchoIds = seenEchosData ? seenEchosData.map(s => s.echo_id) : [];

      // Step 2: Fetch a batch of echoes not in the seen list
      let query = supabase
        .from('echoes')
        .select('id, content');

      if (seenEchoIds.length > 0) {
        // Correct syntax for .not() with an array of values for 'in' clause
        query = query.not('id', 'in', `(${seenEchoIds.join(',')})`);
      }
      
      // Fetch a limited number of the oldest unseen echoes.
      // For better randomness from a larger pool, a database function is preferred.
      query = query.order('created_at', { ascending: true }).limit(10);

      const { data: unseenEchos, error: fetchError } = await query;

      if (fetchError) {
        console.error("Error fetching unseen echoes:", fetchError);
        throw fetchError;
      }

      if (unseenEchos && unseenEchos.length > 0) {
        // Pick one randomly from the fetched batch
        const randomEcho = unseenEchos[Math.floor(Math.random() * unseenEchos.length)];

        // Step 3: Mark this echo as seen for the current user
        const { error: insertSeenError } = await supabase
          .from('seen_echoes')
          .insert({ user_id: user.id, echo_id: randomEcho.id });

        if (insertSeenError) {
          console.error("Error marking echo as seen:", insertSeenError);
          setFeedbackMessage("Could not save this echo as seen. You might see it again, or try catching another.");
          // Decide if we should still show the echo or not. For now, let's show it.
        }
        
        setCaughtEcho(randomEcho);

      } else {
        setFeedbackMessage("No new echoes available to catch right now. Try again later or submit one!");
      }
    } catch (error: any) {
      console.error("Error in handleCatchEcho:", error);
      setFeedbackMessage(`An error occurred: ${error.message}. Please try again.`);
    }

    setIsCatching(false);
  };

  if (authLoading) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-lg">Initializing session...</p>
      </main>
    );
  }

  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
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

          {feedbackMessage && !caughtEcho && (
            <p className="mt-6 text-lg text-gray-500 dark:text-gray-400 animate-fadeIn">
              {feedbackMessage}
            </p>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
