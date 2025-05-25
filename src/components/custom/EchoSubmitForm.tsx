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
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";
import { toast } from "sonner";
import { Send, Sparkles, Loader2 } from 'lucide-react';

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

    const { data, error } = await supabase.from("echoes").insert([
      {
        content: echoText,
      },
    ]);

    setIsLoading(false);

    if (error) {
      console.error("Error submitting echo:", error);
      toast.error(`Failed to submit echo: ${error.message}`);
    } else {
      console.log("Echo submitted successfully:", data);
      toast.success("Your echo has been cast into the void!");
      setEchoText("");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setEchoText("");
      }
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <Button 
            className="relative w-full bg-slate-800/90 backdrop-blur-sm hover:bg-slate-700/90 text-white border border-slate-600/50 font-semibold py-8 px-12 rounded-2xl shadow-xl transform transition-all duration-300 ease-out hover:scale-105 group min-w-[320px]"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="text-xl font-semibold">Drop an Echo</div>
                <div className="text-sm text-gray-300 opacity-80 mt-1">Share your thoughts anonymously</div>
              </div>
            </div>
          </Button>
        </div>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-slate-800/95 backdrop-blur-xl border-slate-600/50 text-white shadow-2xl rounded-2xl">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur"></div>
        <div className="relative">
          <DialogHeader className="space-y-4 pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold text-white">
                  Cast Your Echo
                </DialogTitle>
                <DialogDescription className="text-gray-300 mt-1">
                  Share a thought that will drift through the digital ether
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="relative">
              <Textarea
                id="echoText"
                placeholder="What whispers through your mind? Share it with the void..."
                value={echoText}
                onChange={handleTextChange}
                rows={5}
                disabled={isLoading}
                className={`w-full bg-slate-900/50 border-slate-600/50 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 rounded-xl p-4 text-base leading-relaxed resize-none transition-all duration-200 ${
                  isOverLimit ? 'border-red-500/70 focus:ring-red-500/50 focus:border-red-500/70' : ''
                }`}
              />
              <div className="absolute bottom-3 right-3">
                <div className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isOverLimit 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : currentLength > MAX_ECHO_LENGTH * 0.8
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : 'bg-slate-700/50 text-gray-400 border border-slate-600/30'
                }`}>
                  {currentLength}/{MAX_ECHO_LENGTH}
                </div>
              </div>
            </div>
            
            {isOverLimit && (
              <div className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <p className="text-sm text-red-400">
                  Your echo is too long. Please keep it under {MAX_ECHO_LENGTH} characters.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-6">
            <div className="flex items-center space-x-3 w-full">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-transparent border-slate-600/50 text-gray-300 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={handleSubmit} 
                disabled={isLoading || isOverLimit || !echoText.trim()}
                className={`flex-1 relative overflow-hidden font-semibold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 ease-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isOverLimit || !echoText.trim()
                    ? 'bg-slate-600 text-gray-400' 
                    : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white group'
                }`}
              >
                {!isOverLimit && !isLoading && echoText.trim() && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                )}
                <div className="relative flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>
                    {isLoading ? "Casting..." : "Cast Echo"}
                  </span>
                </div>
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
} 