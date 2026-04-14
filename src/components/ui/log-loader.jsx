import React from 'react';

export const LogLoader = ({ text, className }) => {
  const displayText = (text || 'LOADING').replace(/\.+$/, '');

  return (
    <div className={className || "flex flex-col items-center justify-center gap-6 p-8 w-full h-full min-h-[50vh] animate-in fade-in duration-500"}>
      {/* Sinusoidal Signal Animation */}
      <div className="flex items-center justify-center gap-1.5 h-10">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const delay = i * 0.15;
          return (
            <div
              key={i}
              className="w-1.5 bg-zinc-800 dark:bg-zinc-200 rounded-full animate-[sineWave_1.5s_ease-in-out_infinite]"
              style={{ 
                height: '100%',
                animationDelay: `-${delay}s`
              }}
            />
          );
        })}
      </div>
      
      {/* Loading Text */}
      <div className="flex flex-col items-center gap-2">
        <p className="text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-2">
          {displayText}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sineWave {
          0%, 100% {
            transform: scaleY(0.2);
            opacity: 0.3;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}} />
    </div>
  );
};
