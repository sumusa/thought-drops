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
    <div className={`mt-8 flex flex-col items-center justify-center text-center p-6 border border-dashed border-dark-border rounded-xl bg-dark-surface/80 animate-fadeIn`}>
      <svg 
        width="80" 
        height="60" 
        viewBox="0 0 80 60" 
        className={`text-dark-text-subtle mb-4 ${svgOpacity}`} 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Three soft, horizontal, rounded bars representing gentle waves/echoes */}
        <rect x="10" y="15" width="60" height="6" rx="3" fill="currentColor" opacity="0.3" />
        <rect x="20" y="25" width="40" height="6" rx="3" fill="currentColor" className="animate-pulse-opacity" style={{ opacity: 0.5 }} />
        <rect x="15" y="35" width="50" height="6" rx="3" fill="currentColor" opacity="0.4" />
      </svg>
      <h3 className="text-xl font-semibold text-dark-text-primary mb-2" dangerouslySetInnerHTML={{ __html: title }} />
      <p className="text-dark-text-subtle" dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
};

export { EmptyEchoState };
// export type { NoEchoReason }; // Already exported with its definition 