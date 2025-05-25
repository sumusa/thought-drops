import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabaseClient"; // Adjusted import path
import { useState } from "react";

export function EchoSubmitForm() {
  const [echoText, setEchoText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!echoText.trim()) {
      alert("Please write something before submitting.");
      return;
    }

    setIsLoading(true);

    const currentTime = new Date();
    // Random delay between 1 and 24 hours
    const randomHours = Math.floor(Math.random() * 24) + 1;
    const revealAtTime = new Date(
      currentTime.getTime() + randomHours * 60 * 60 * 1000
    );

    const { data, error } = await supabase.from("echoes").insert([
      {
        content: echoText,
        reveal_at: revealAtTime.toISOString(), // Supabase expects ISO string for timestamps
        // is_claimed and likes_count will use their default values
      },
    ]);

    setIsLoading(false);

    if (error) {
      console.error("Error submitting echo:", error);
      alert(`Failed to submit echo: ${error.message}`);
    } else {
      console.log("Echo submitted successfully:", data);
      alert("Your echo has been submitted and will be revealed later!");
      setEchoText(""); // Clear textarea
      setIsOpen(false); // Close dialog
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Reset text if dialog is closed without submitting
      if (!open) {
        setEchoText("");
      }
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">Drop an Echo</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share a Thought</DialogTitle>
          <DialogDescription>
            What's on your mind? It will be released anonymously after a short
            delay.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="echoText"
            placeholder="Type your message here..."
            value={echoText}
            onChange={(e) => setEchoText(e.target.value)}
            rows={4}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 