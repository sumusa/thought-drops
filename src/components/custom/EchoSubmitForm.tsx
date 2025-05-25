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
import { useState } from "react";

export function EchoSubmitForm() {
  const [echoText, setEchoText] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = () => {
    // TODO: Implement submission to Supabase
    console.log("Submitting echo:", echoText);
    setEchoText(""); // Clear textarea
    setIsOpen(false); // Close dialog
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
          />
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 