

import { useState, useEffect } from 'react';

export const useSound = (url, { volume = 1, interrupt = true } = {}) => {
  const [audio] = useState(new Audio(url));
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    audio.volume = volume;

    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('ended', onEnded);
    };
  }, [audio, volume]);

  const play = () => {
    if (interrupt || !isPlaying) {
      audio.currentTime = 0;
      audio.play().catch(e => console.error("Could not play sound:", e));
      setIsPlaying(true);
    }
  };

  return [play];
};
