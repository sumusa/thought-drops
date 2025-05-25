// import { NoEchoReason } from "@/App"; // REMOVE THIS LINE

// DEFINE THE TYPE HERE
export type NoEchoReason = 'loading' | 'no_new_echoes' | 'all_seen' | 'initial' | 'error' | null;

interface EmptyEchoStateProps {
  reason: NoEchoReason;
}

const EmptyEchoState = ({ reason }: EmptyEchoStateProps) => {
  let title = "The air is quiet now...";
  let message = "No echoes to catch at this moment. <br /> Why not release one of your own?";
  let svgOpacity = "opacity-75";

  switch (reason) {
    case 'loading':
      title = "Searching for echoes...";
      message = "Please wait while we scan the ether.";
      // Could add a spinner or different SVG here if desired
      break;
    case 'no_new_echoes':
      title = "No Echoes in the Void";
      message = "It seems there are no echoes floating around anywhere. <br /> Be the first to cast one out!";
      svgOpacity = "opacity-50";
      break;
    case 'all_seen':
      title = "All Echoes Heard";
      message = "You've caught every echo available to you for now. <br /> Check back later for new whispers, or share a new thought.";
      svgOpacity = "opacity-60";
      break;
    case 'error':
      title = "A Disturbance in the Ether";
      message = "Something went wrong while trying to catch an echo. <br /> Please try again.";
      svgOpacity = "opacity-40";
      break;
    case 'initial': // Default before any catch attempt
    default:
      // Use default title/message
      break;
  }

  return (
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-slate-500/20 via-gray-500/20 to-slate-500/20 rounded-2xl blur opacity-50"></div>
      <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-600/30 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-2xl blur"></div>
            <div className="relative p-4 bg-slate-900/50 rounded-2xl border border-slate-600/30">
              <svg 
                width="60" 
                height="45" 
                viewBox="0 0 60 45" 
                className={`text-gray-400 ${svgOpacity}`} 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="8" y="12" width="44" height="4" rx="2" fill="currentColor" opacity="0.3" />
                <rect x="15" y="20" width="30" height="4" rx="2" fill="currentColor" className="animate-pulse-opacity" style={{ opacity: 0.5 }} />
                <rect x="12" y="28" width="36" height="4" rx="2" fill="currentColor" opacity="0.4" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-white">
            {title}
          </h3>
          <p className="text-gray-400 leading-relaxed max-w-sm mx-auto" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        
        {reason === 'all_seen' && (
          <div className="mt-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-sm text-cyan-400">
              ✨ You've explored all available echoes! Check back later for new whispers.
            </p>
          </div>
        )}
        
        {reason === 'no_new_echoes' && (
          <div className="mt-6 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <p className="text-sm text-purple-400">
              🌟 Be the first to cast an echo into the void!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export { EmptyEchoState };
// export type { NoEchoReason }; // Already exported with its definition 