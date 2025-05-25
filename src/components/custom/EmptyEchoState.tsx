const EmptyEchoState = () => {
  return (
    <div className="mt-8 flex flex-col items-center justify-center text-center p-6 border border-dashed border-calm-border rounded-xl bg-calm-card-bg/50 animate-fadeIn">
      <svg 
        width="80" 
        height="60" 
        viewBox="0 0 80 60" 
        className="text-calm-subtext mb-4 opacity-75" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Three soft, horizontal, rounded bars representing gentle waves/echoes */}
        <rect x="10" y="15" width="60" height="6" rx="3" fill="currentColor" opacity="0.3" />
        <rect x="20" y="25" width="40" height="6" rx="3" fill="currentColor" className="animate-pulse-opacity" style={{ opacity: 0.5 }} />
        <rect x="15" y="35" width="50" height="6" rx="3" fill="currentColor" opacity="0.4" />
      </svg>
      <h3 className="text-xl font-semibold text-calm-text mb-2">
        The air is quiet now...
      </h3>
      <p className="text-calm-subtext">
        No echoes to catch at this moment. <br />
        Why not release one of your own?
      </p>
    </div>
  );
};

export { EmptyEchoState }; 