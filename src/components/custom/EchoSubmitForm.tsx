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
import { toast } from "sonner"; // Corrected import for toast

export function EchoSubmitForm() {
  const [echoText, setEchoText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!echoText.trim()) {
      toast.warning("Please write something before submitting."); // Changed from alert
      return;
    }
    setIsLoading(true);

    // Removed revealAtTime logic as it's no longer in the schema
    // const currentTime = new Date();
    // const randomHours = Math.floor(Math.random() * 24) + 1;
    // const revealAtTime = new Date(
    //   currentTime.getTime() + randomHours * 60 * 60 * 1000
    // );

    const { data, error } = await supabase.from("echoes").insert([
      {
        content: echoText,
        // reveal_at: revealAtTime.toISOString(), // Removed
      },
    ]);

    setIsLoading(false);

    if (error) {
      console.error("Error submitting echo:", error);
      toast.error(`Failed to submit echo: ${error.message}`); // Changed from alert
    } else {
      console.log("Echo submitted successfully:", data);
      toast.success("Your echo has been submitted!"); // Changed from alert
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