import './App.css'
import { EchoSubmitForm } from '@/components/custom/EchoSubmitForm'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient";
import { useState } from 'react'

interface Echo {
  id: string;
  content: string;
}

function App() {
  const [caughtEcho, setCaughtEcho] = useState<Echo | null>(null);
  const [isCatching, setIsCatching] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleCatchEcho = async () => {
    setIsCatching(true);
    setCaughtEcho(null);
    setFeedbackMessage(null);

    try {
      const { data: fetchedEchos, error: fetchError } = await supabase
        .from('echoes')
        .select('id, content')
        .eq('is_claimed', false)
        .lte('reveal_at', new Date().toISOString())
        .order('created_at', { ascending: true })
        .limit(1);

      if (fetchError) {
        console.error("Error during Supabase fetch:", JSON.stringify(fetchError, null, 2));
        throw fetchError;
      }

      if (fetchedEchos && fetchedEchos.length > 0) {
        const echoToClaim = fetchedEchos[0];
        
        console.log("Attempting to claim echo:", JSON.stringify(echoToClaim, null, 2));

        const { error: updateError } = await supabase
          .from('echoes')
          .update({ is_claimed: true })
          .eq('id', echoToClaim.id)
          .eq('is_claimed', false);
        
        if (updateError) {
          console.error("Supabase update error object:", JSON.stringify(updateError, null, 2));
          console.warn("Failed to claim echo (possibly already claimed):", updateError.message);
          setFeedbackMessage("Oops! That echo vanished too quickly. Try catching another.");
        } else {
          setCaughtEcho(echoToClaim);
        }

      } else {
        setFeedbackMessage("No echoes available to catch right now. Please try again later.");
      }
    } catch (error: any) {
      console.error("Error catching echo (overall try-catch):", JSON.stringify(error, null, 2));
      setFeedbackMessage(`An error occurred: ${error.message}. Please try again.`);
    }

    setIsCatching(false);
  };

  return (
    <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <header className="text-center mb-8">
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
          <Button onClick={handleCatchEcho} disabled={isCatching} size="lg">
            {isCatching ? "Searching for an Echo..." : "Catch an Echo"}
          </Button>

          {caughtEcho && (
            <Card className="mt-8 text-left animate-fadeIn">
              <CardHeader>
                <CardTitle>An Echo Resonates...</CardTitle>
                <CardDescription>You caught a fleeting thought. It will vanish once you leave or catch another.</CardDescription>
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
