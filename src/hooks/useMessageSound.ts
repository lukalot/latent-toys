import { useCallback } from 'react';

export const useMessageSound = () => {
  return useCallback(() => {
    const audio = new Audio('/033528790-pebble-click-button.wav');
    audio.volume = 0.2;
    audio.play().catch(() => {
      // Silently handle autoplay restrictions
    });
  }, []);
}; 