import React, { useEffect, useRef } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { Card, CardContent } from './ui/card';

const ReplayPlayer = ({ events }) => {
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && events && events.length > 0) {
      // Clear container before initializing new player
      containerRef.current.innerHTML = '';
      
      try {
        playerRef.current = new rrwebPlayer({
          target: containerRef.current,
          props: {
            events,
            width: containerRef.current.offsetWidth || 800,
            height: 500,
            autoPlay: false,
          },
        });
      } catch (err) {
        console.error('Failed to initialize rrweb-player', err);
      }
    }

    return () => {
      if (playerRef.current) {
        // Cleaning up the player if necessary
        // rrweb-player doesn't have a formal destroy method, 
        // but clearing innerHTML handles the DOM side.
      }
    };
  }, [events]);

  return (
    <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          className="w-full bg-black flex items-center justify-center min-h-[500px]"
          style={{ '--rr-player-background': '#000000' }}
        />
      </CardContent>
    </Card>
  );
};

export default ReplayPlayer;
