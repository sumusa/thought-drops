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
import { Send, Sparkles, Loader2, Wand2, RefreshCw, Bot } from 'lucide-react';
import { MoodSelector } from '@/components/MoodSelector';
import type { EchoMood } from '@/types/moods';

const MAX_ECHO_LENGTH = 300;

// Creative writing prompts and inspiration
const CREATIVE_PROMPTS = [
  "What if colors had sounds? Describe the symphony of a sunset.",
  "You found a message in a bottle from your future self. What does it say?",
  "The last person on Earth discovers they're not alone. What happens next?",
  "Describe a memory that feels like a warm hug.",
  "What would you tell your younger self if you could whisper one thing?",
  "You can taste emotions. What does hope taste like?",
  "The city sleeps, but you're awake. What secrets does the night reveal?",
  "If your thoughts were visible, what would people see floating around you?",
  "You discover a door in your house that wasn't there yesterday. Where does it lead?",
  "What does silence sound like in your mind?",
  "Describe the feeling of being understood without words.",
  "You can hear the thoughts of inanimate objects for one day. What do they say?",
  "What would you do if you had an extra hour that nobody else experienced?",
  "The rain carries messages from strangers. What does today's storm bring?",
  "You wake up with the ability to see everyone's hidden dreams. What do you discover?",
  "Describe a moment when time felt like it stopped.",
  "What would you write on a paper airplane meant for the universe?",
  "You find a library where books write themselves. What story calls to you?",
  "If you could bottle a feeling, which one would you choose and why?",
  "The stars are actually windows to other worlds. What do you see through them?",
  "You discover you can communicate with your past self through dreams. What do you share?",
  "What does your soul look like when nobody's watching?",
  "You can feel the emotions of places. What does your favorite spot feel like?",
  "Describe the conversation between your heart and your mind.",
  "What would you say to someone who needs to hear it today?",
  "You find a key that unlocks any door, but only once. Which door do you choose?",
  "What does it feel like to be a thought traveling through someone's mind?",
  "You can see the invisible threads connecting all living things. What do they look like?",
  "Describe the moment when a stranger's smile changed your day.",
  "What would you write in the margins of the universe?"
];

const MOOD_BASED_PROMPTS = {
  reflective: [
    "What lesson did today teach you?",
    "Describe a moment when you surprised yourself.",
    "What would you tell someone going through what you've experienced?",
    "What pattern do you notice in your thoughts lately?"
  ],
  hopeful: [
    "What small thing gave you hope today?",
    "Describe the future you're building with your choices.",
    "What possibility excites you most right now?",
    "Share a dream that feels within reach."
  ],
  melancholy: [
    "What beauty do you find in sadness?",
    "Describe a bittersweet memory that shaped you.",
    "What would you say to comfort your past self?",
    "How does rain feel on your soul?"
  ],
  creative: [
    "If you could paint with words, what would you create?",
    "Describe the world through the eyes of your imagination.",
    "What story is your heart trying to tell?",
    "Create something that has never existed before."
  ],
  grateful: [
    "What ordinary moment felt extraordinary today?",
    "Who or what are you quietly thankful for?",
    "Describe a simple pleasure that brings you joy.",
    "What gift did life give you that you almost missed?"
  ],
  curious: [
    "What question keeps your mind wandering?",
    "Describe something you've always wondered about.",
    "What mystery would you love to solve?",
    "Share a 'what if' that fascinates you."
  ]
};

// AI-generated echo examples - realistic, varied, and authentic feeling
const AI_GENERATED_ECHOES = [
  // Reflective echoes
  "Sometimes I catch myself smiling at memories that used to make me cry. Growth feels like learning to hold both the pain and the beauty of what was.",
  
  "I realized today that the voice in my head that says 'you're not ready' is the same one that kept me safe as a child. Maybe it's time to thank it and gently ask it to step aside.",
  
  "There's something profound about watching someone you love discover something new about themselves. It's like witnessing a star being born.",
  
  // Hopeful echoes
  "The barista remembered my order today. Such a small thing, but it felt like being seen. Maybe connection is built from these tiny moments of recognition.",
  
  "I planted seeds in my garden knowing I might not be here to see them bloom. But someone will. That thought fills me with unexpected peace.",
  
  "Every morning, my coffee tastes like possibility. Today feels different - like the universe is holding its breath, waiting for something beautiful.",
  
  // Melancholy echoes
  "Rain sounds different when you're missing someone. Each drop carries a memory, and the storm becomes a symphony of what was.",
  
  "I found an old book with someone else's notes in the margins. Their thoughts felt like whispers from another life, another heart that once beat with wonder.",
  
  "The empty chair at dinner still holds space for conversations we'll never have. Grief is love with nowhere to go.",
  
  // Creative echoes
  "If thoughts were colors, mine would be watercolors bleeding into each other - no clean lines, just beautiful chaos blending into something new.",
  
  "I dreamed I was a library where people came to borrow feelings instead of books. The most popular section was 'hope' - always checked out, always renewed.",
  
  "Words are just breath given shape, but somehow they can build bridges across the vast spaces between souls.",
  
  // Grateful echoes
  "The way sunlight filters through my curtains each morning feels like the universe saying 'good morning' personally to me.",
  
  "My grandmother's recipe tastes like love made tangible. Some gifts transcend the physical world and live on in every bite, every memory.",
  
  "A stranger held the elevator for me today. In that small act of kindness, I remembered that we're all just walking each other home.",
  
  // Curious echoes
  "What if every person we pass on the street is the main character of a story as complex and beautiful as our own? The thought makes me want to bow to everyone.",
  
  "I wonder if the stars get lonely, burning so bright and so far apart. Maybe that's why they twinkle - they're waving at each other across the darkness.",
  
  "Do our dreams visit each other when we sleep? Maybe that's why sometimes we wake up feeling like we've been somewhere impossible and wonderful.",
  
  // Philosophical echoes
  "Time moves differently when you're paying attention. A moment of true presence can feel like eternity, while years of distraction pass like seconds.",
  
  "We're all just walking each other home through this strange, beautiful existence. The path is uncertain, but the company makes it worthwhile.",
  
  "I think consciousness is the universe's way of experiencing itself subjectively. We're not separate from the cosmos - we're how it dreams.",
  
  // Nostalgic echoes
  "Old photographs feel like windows to parallel worlds where everyone we've lost is still laughing, still young, still possible.",
  
  "The smell of rain on hot pavement takes me back to summer afternoons when time moved like honey and everything felt infinite.",
  
  "I found a song that sounds exactly like being seventeen and believing the whole world was waiting for me to discover it.",
  
  // Peaceful echoes
  "There's a moment just before dawn when the world holds its breath. In that silence, I remember what it feels like to simply exist without needing to become anything else.",
  
  "Watching clouds drift by reminds me that everything is temporary, and somehow that makes each moment more precious, not less.",
  
  "The ocean doesn't try to be profound - it just is. Maybe that's the secret to peace: stop performing depth and just be deeply yourself."
];

// Mood-specific AI echoes for better matching
const MOOD_BASED_AI_ECHOES = {
  reflective: [
    "Sometimes I catch myself smiling at memories that used to make me cry. Growth feels like learning to hold both the pain and the beauty of what was.",
    "I realized today that the voice in my head that says 'you're not ready' is the same one that kept me safe as a child. Maybe it's time to thank it and gently ask it to step aside.",
    "There's something profound about watching someone you love discover something new about themselves. It's like witnessing a star being born."
  ],
  hopeful: [
    "The barista remembered my order today. Such a small thing, but it felt like being seen. Maybe connection is built from these tiny moments of recognition.",
    "I planted seeds in my garden knowing I might not be here to see them bloom. But someone will. That thought fills me with unexpected peace.",
    "Every morning, my coffee tastes like possibility. Today feels different - like the universe is holding its breath, waiting for something beautiful."
  ],
  melancholy: [
    "Rain sounds different when you're missing someone. Each drop carries a memory, and the storm becomes a symphony of what was.",
    "I found an old book with someone else's notes in the margins. Their thoughts felt like whispers from another life, another heart that once beat with wonder.",
    "The empty chair at dinner still holds space for conversations we'll never have. Grief is love with nowhere to go."
  ],
  creative: [
    "If thoughts were colors, mine would be watercolors bleeding into each other - no clean lines, just beautiful chaos blending into something new.",
    "I dreamed I was a library where people came to borrow feelings instead of books. The most popular section was 'hope' - always checked out, always renewed.",
    "Words are just breath given shape, but somehow they can build bridges across the vast spaces between souls."
  ],
  grateful: [
    "The way sunlight filters through my curtains each morning feels like the universe saying 'good morning' personally to me.",
    "My grandmother's recipe tastes like love made tangible. Some gifts transcend the physical world and live on in every bite, every memory.",
    "A stranger held the elevator for me today. In that small act of kindness, I remembered that we're all just walking each other home."
  ],
  curious: [
    "What if every person we pass on the street is the main character of a story as complex and beautiful as our own? The thought makes me want to bow to everyone.",
    "I wonder if the stars get lonely, burning so bright and so far apart. Maybe that's why they twinkle - they're waving at each other across the darkness.",
    "Do our dreams visit each other when we sleep? Maybe that's why sometimes we wake up feeling like we've been somewhere impossible and wonderful."
  ],
  peaceful: [
    "There's a moment just before dawn when the world holds its breath. In that silence, I remember what it feels like to simply exist without needing to become anything else.",
    "Watching clouds drift by reminds me that everything is temporary, and somehow that makes each moment more precious, not less.",
    "The ocean doesn't try to be profound - it just is. Maybe that's the secret to peace: stop performing depth and just be deeply yourself."
  ],
  philosophical: [
    "Time moves differently when you're paying attention. A moment of true presence can feel like eternity, while years of distraction pass like seconds.",
    "We're all just walking each other home through this strange, beautiful existence. The path is uncertain, but the company makes it worthwhile.",
    "I think consciousness is the universe's way of experiencing itself subjectively. We're not separate from the cosmos - we're how it dreams."
  ],
  nostalgic: [
    "Old photographs feel like windows to parallel worlds where everyone we've lost is still laughing, still young, still possible.",
    "The smell of rain on hot pavement takes me back to summer afternoons when time moved like honey and everything felt infinite.",
    "I found a song that sounds exactly like being seventeen and believing the whole world was waiting for me to discover it."
  ]
};

interface EchoSubmitFormProps {
  onEchoSubmitted?: () => void;
  compact?: boolean;
}

export function EchoSubmitForm({ onEchoSubmitted, compact = false }: EchoSubmitFormProps = {}) {
  const [echoText, setEchoText] = useState("");
  const [selectedMood, setSelectedMood] = useState<EchoMood | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);

  const currentLength = echoText.length;
  const isOverLimit = currentLength > MAX_ECHO_LENGTH;

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEchoText(event.target.value);
  };

  const generateInspiration = () => {
    setIsGenerating(true);
    
    // Simulate a brief loading for better UX
    setTimeout(() => {
      let prompts = CREATIVE_PROMPTS;
      
      // Use mood-specific prompts if a mood is selected
      if (selectedMood && MOOD_BASED_PROMPTS[selectedMood.name as keyof typeof MOOD_BASED_PROMPTS]) {
        const moodPrompts = MOOD_BASED_PROMPTS[selectedMood.name as keyof typeof MOOD_BASED_PROMPTS];
        prompts = [...moodPrompts, ...CREATIVE_PROMPTS];
      }
      
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setCurrentPrompt(randomPrompt);
      setIsGenerating(false);
      
      toast.success("✨ Creative spark generated!");
    }, 800);
  };

  const generateAIEcho = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
      // Get mood-specific echoes if a mood is selected, otherwise use general pool
      let echoPool = selectedMood && MOOD_BASED_AI_ECHOES[selectedMood.name as keyof typeof MOOD_BASED_AI_ECHOES] 
        ? MOOD_BASED_AI_ECHOES[selectedMood.name as keyof typeof MOOD_BASED_AI_ECHOES]
        : AI_GENERATED_ECHOES;
      
      // Add some randomization and variation to reduce exact duplicates
      const variations = [
        // Original echo
        (echo: string) => echo,
        // Add subtle variations
        (echo: string) => echo.replace(/\.$/, '...'),
        (echo: string) => echo.replace(/\?$/, '? 🤔'),
        (echo: string) => echo.replace(/today/g, Math.random() > 0.5 ? 'today' : 'right now'),
        (echo: string) => echo.replace(/I /g, Math.random() > 0.5 ? 'I ' : 'Sometimes I '),
        (echo: string) => echo.replace(/Maybe /g, Math.random() > 0.5 ? 'Maybe ' : 'Perhaps '),
        // Add timestamp-based uniqueness for development/testing
        (echo: string) => {
          if (process.env.NODE_ENV === 'development') {
            const timeStamp = new Date().getTime().toString().slice(-4);
            return echo + ` [${timeStamp}]`;
          }
          return echo;
        }
      ];
      
      // Select random echo and apply random variation
      const randomEcho = echoPool[Math.floor(Math.random() * echoPool.length)];
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      const finalEcho = randomVariation(randomEcho);
      
      setEchoText(finalEcho);
      setIsGenerating(false);
      
      toast.success("AI has whispered an echo into your mind ✨");
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const usePrompt = () => {
    if (currentPrompt) {
      setEchoText(currentPrompt);
      setCurrentPrompt(null);
      toast.info("Prompt added! Feel free to edit and make it your own.");
    }
  };

  const handleSubmit = async () => {
    if (!echoText.trim()) {
      toast.info("Your thoughts are waiting to be shared 💭");
      return;
    }
    if (isOverLimit) {
      toast.info(`Almost there! Please keep your echo under ${MAX_ECHO_LENGTH} characters ✂️`);
      return;
    }
    setIsLoading(true);

    try {
      // Check for similar content (not just exact duplicates)
      const { data: similarityResult, error: similarityError } = await supabase.rpc(
        'check_similar_content',
        { 
          content_text: echoText.trim(),
          similarity_threshold: 0.85 // 85% similarity threshold
        }
      );

      if (similarityError) {
        console.error("Error checking for similar content:", similarityError);
        // Continue with submission if similarity check fails
      } else if (similarityResult && similarityResult.length > 0 && similarityResult[0].is_similar) {
        const result = similarityResult[0];
        setIsLoading(false);
        
        // Get suggestions for making content unique
        const { data: suggestions } = await supabase.rpc(
          'get_content_suggestions',
          { 
            original_content: echoText.trim(),
            mood_name: selectedMood?.name || null
          }
        );

        const suggestionText = suggestions && suggestions.length > 0 
          ? suggestions[Math.floor(Math.random() * suggestions.length)].suggestion
          : "Try adding your personal perspective or experience to make it unique.";

        toast.error(
          `Similar echo detected (${Math.round(result.similarity_score * 100)}% match). ${suggestionText} ✨`,
          { duration: 6000 }
        );
        return;
      }

      // Fallback to exact duplicate check if similarity check didn't run
      const { data: isDuplicate, error: duplicateError } = await supabase.rpc(
        'check_duplicate_content',
        { content_text: echoText.trim() }
      );

      if (duplicateError) {
        console.error("Error checking for duplicates:", duplicateError);
        // Continue with submission if duplicate check fails
      } else if (isDuplicate) {
        setIsLoading(false);
        toast.error("This echo already exists in the void. Try sharing something unique! ✨");
        return;
      }

      // Generate content hash for the new echo
      const { data: contentHash, error: hashError } = await supabase.rpc(
        'generate_content_hash',
        { content_text: echoText.trim() }
      );

      if (hashError) {
        console.error("Error generating content hash:", hashError);
        // Continue without hash if generation fails
      }

      // Insert the echo with content hash
      const { data, error } = await supabase.from("echoes").insert([
        {
          content: echoText.trim(),
          mood_id: selectedMood?.id || null,
          content_hash: contentHash || null,
        },
      ]).select();

      setIsLoading(false);

      if (error) {
        console.error("Error submitting echo:", error);
        if (error.code === '23505' && error.message.includes('unique_content_hash')) {
          toast.error("This echo already exists in the void. Try sharing something unique! ✨");
        } else {
          toast.error(`Failed to submit echo: ${error.message}`);
        }
      } else if (data && data.length > 0) {
        const submittedEcho = data[0];
        console.log("Echo submitted successfully:", submittedEcho);
        
        // IMPORTANT: Mark the user as having "seen" their own echo immediately
        // This establishes ownership in the echo history system
        try {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          if (currentUser) {
            const { error: seenError } = await supabase
              .from('seen_echoes')
              .insert({ 
                user_id: currentUser.id, 
                echo_id: submittedEcho.id 
              });
            
            if (seenError) {
              console.error("Error marking own echo as seen:", seenError);
              // Don't show error to user as the echo was submitted successfully
            } else {
              console.log("Successfully marked own echo as seen for history tracking");
            }
          }
        } catch (trackingError) {
          console.error("Error in ownership tracking:", trackingError);
          // Don't fail the submission over tracking issues
        }
        
        toast.success("Your thoughts are now part of something beautiful 💫");
        resetForm();
        setIsOpen(false);
        
        // Call the callback if provided (for refreshing history page)
        if (onEchoSubmitted) {
          onEchoSubmitted();
        }
      }
    } catch (error: any) {
      setIsLoading(false);
      console.error("Error in handleSubmit:", error);
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  const resetForm = () => {
    setEchoText("");
    setSelectedMood(null);
    setCurrentPrompt(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
      }
      setIsOpen(open);
    }}>
      <DialogTrigger asChild>
        {compact ? (
          <Button 
            className="relative bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg transform transition-all duration-300 ease-out hover:scale-105 border border-cyan-500/30"
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Drop an Echo</span>
            </div>
          </Button>
        ) : (
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
        )}
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
            {/* AI Generate Section */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={generateInspiration}
                disabled={isGenerating}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white border-0 shadow-lg shadow-violet-500/20 transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Get Inspiration
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={generateAIEcho}
                disabled={isGenerating}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border-0 shadow-lg shadow-emerald-500/20 transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-2" />
                    AI Generate Echo
                  </>
                )}
              </Button>
              
              {currentPrompt && (
                <Button
                  type="button"
                  onClick={usePrompt}
                  variant="outline"
                  className="bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20 hover:border-green-500/50"
                >
                  Use This Prompt
                </Button>
              )}
            </div>

            {/* Generated Prompt Display */}
            {currentPrompt && (
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-violet-500/20 rounded-lg mt-1">
                    <Wand2 className="w-3 h-3 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-violet-300 mb-1">Creative Spark</p>
                    <p className="text-gray-200 text-sm leading-relaxed">{currentPrompt}</p>
                  </div>
                  <Button
                    type="button"
                    onClick={generateInspiration}
                    variant="ghost"
                    size="sm"
                    className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 p-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

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

            {/* Mood Selector */}
            <div className="space-y-3">
              <MoodSelector
                selectedMood={selectedMood}
                onMoodSelect={setSelectedMood}
                variant="submit"
              />
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
                onClick={() => {
                  resetForm();
                  setIsOpen(false);
                }}
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