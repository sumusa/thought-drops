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
import { Send } from 'lucide-react'; // Import Send icon

const MAX_ECHO_LENGTH = 300;

export function EchoSubmitForm() {
  const [echoText, setEchoText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentLength = echoText.length;
  const isOverLimit = currentLength > MAX_ECHO_LENGTH;

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEchoText(event.target.value);
  };

  const handleSubmit = async () => {
    if (!echoText.trim()) {
      toast.warning("Please write something before submitting.");
      return;
    }
    if (isOverLimit) {
      toast.error(`Your echo is too long. Please keep it under ${MAX_ECHO_LENGTH} characters.`);
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
      if (!open) {
        setEchoText(""); // Clear text when dialog is closed
      }
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-dark-accent hover:bg-cyan-500 text-dark-bg font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 ease-in-out hover:scale-105 flex items-center space-x-2"
        >
            <Send className="w-4 h-4 mr-2" /> 
            Drop an Echo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1F2937] border-dark-border text-dark-text-primary shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-dark-text-primary">Share a Thought</DialogTitle>
          <DialogDescription className="text-dark-text-subtle">
            What's on your mind? Keep it under {MAX_ECHO_LENGTH} characters.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            id="echoText"
            placeholder="Type your message here..."
            value={echoText}
            onChange={handleTextChange}
            rows={4}
            disabled={isLoading}
            className={`bg-dark-bg border-dark-border text-dark-text-primary focus:ring-dark-accent placeholder:text-dark-text-subtle ${isOverLimit ? 'border-red-500 focus:ring-red-500' : ''}`}
          />
          <div className={`text-sm text-right ${isOverLimit ? 'text-red-400' : 'text-dark-text-subtle'}`}>
            {currentLength}/{MAX_ECHO_LENGTH}
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isLoading || isOverLimit}
            className={`${isOverLimit ? 'bg-gray-500' : 'bg-dark-accent hover:bg-cyan-500'} text-dark-bg font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-200 ease-in-out hover:scale-105 flex items-center space-x-2`}
          >
            <Send className="w-4 h-4" />
            <span>
              {isLoading ? "Submitting..." : "Submit Echo"}
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 