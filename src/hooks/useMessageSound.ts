import { useEffect, useRef } from 'react';
// Import the audio file directly
import messageSound from '../assets/033528790-pebble-click-button.wav';

export const useMessageSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const documentVisibilityRef = useRef(document.visibilityState);

  useEffect(() => {
    // Create audio element with the imported sound
    audioRef.current = new Audio(messageSound);

    // Update visibility state
    const handleVisibilityChange = () => {
      documentVisibilityRef.current = document.visibilityState;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const playMessageSound = () => {
    // Only play sound if tab is not visible
    if (documentVisibilityRef.current === 'hidden' && audioRef.current) {
      audioRef.current.currentTime = 0; // Reset audio to start
      audioRef.current.play().catch(err => {
        console.error('Failed to play message sound:', err);
      });
    }
  };

  return playMessageSound;
}; 