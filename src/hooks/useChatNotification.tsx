import { useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationOptions {
  enabled?: boolean;
  soundEnabled?: boolean;
  showToast?: boolean;
}

export const useChatNotification = (options: NotificationOptions = {}) => {
  const { enabled = true, soundEnabled = true, showToast = true } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasInteractedRef = useRef(false);

  // Track user interaction for audio autoplay policy
  useEffect(() => {
    const handleInteraction = () => {
      hasInteractedRef.current = true;
    };

    window.addEventListener('click', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    window.addEventListener('touchstart', handleInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Initialize audio element with a simple notification sound
  useEffect(() => {
    // Create a simple beep sound using Web Audio API as a data URL
    // This is a short notification sound encoded as base64
    const audioDataUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleUMPU8Lm7bZdFSts0+zqsl8XM4HY7eq1ZB0nfdfv6rVoIyeA2fDqs2seK4LZ7+myaB8thdnt6LJoIS+H2e3nsWchMYnZ7OWwZyMzitzr5a9mJTWM3OzjrmUmN4/c6+KtZCc5kdzq4axjKDuT3OrgrGIpPZXd6d6rYipAl93o3aplK0KZ3eje' + 
      'qWMsRJvd596oYy1Fnd3n3adjLkef3ebcpWIvSKHe5dukYS9Kot7k2qRgMEul3uPZo18xTKfe49miXjJOqd7i2KFdM0+r3uHXoFw0Uq3e4NafWzVUr97f1Z5aN1ax3t7UnFk4WLPe3dObWDpatt7c0ppXO1u43tvRmVY8Xbre2tCYVT5gvN7Zz5dUP2K+39jOllNAZMDf186VUkFmwt/WzZRRQmjE39XMk1BDZMD' +
      'f1MuST0RoxN/Uy5FORWrG39PLkE1Ga8jf0sqPTEdtyN/RyY5LSG/K39DJjUpJcczf0MiMSUpzzd/PyItIS3XP38/IikdMd9Hfz8eJRk152N/Ox4hFTnvb383GiERQfN7fzcWHQ1F+4d/MxYZCUoDk38vEhUFThObfy8SEQFaH6d/KwoM/WIrt38nBgj5bjPDfyMGBPV6P9N/HwIA8YJL4' +
      '38fAfztklfzfxr9+OmeY/9/Fvn04apz/38S9fDhtnv/fw7x7N3Ch/9/CvHo2c6T/38G7eTZ2p//fwLp4NXmq/9+/uXc1e63/37+4djR+sP/fvrdzNIG0/96+tXI0hLf/3r20cTSHuv/evrRwNIq9/96+s280jr//3r6ybzSR/96+sm40lP/fvbFtNJf/372wbDSa/9+9r2s0';
    
    audioRef.current = new Audio(audioDataUrl);
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!enabled || !soundEnabled || !audioRef.current || !hasInteractedRef.current) return;

    try {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play failed, likely due to autoplay policy
        console.log('Audio notification blocked by browser');
      });
    } catch (error) {
      console.log('Failed to play notification sound');
    }
  }, [enabled, soundEnabled]);

  const showNotificationToast = useCallback((senderName: string, message: string, avatarUrl?: string) => {
    if (!enabled || !showToast) return;

    toast(
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
          {avatarUrl ? (
            <img loading="lazy" decoding="async" src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-primary">
              {senderName?.charAt(0)?.toUpperCase() || '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{senderName}</p>
          <p className="text-xs text-muted-foreground truncate">{message}</p>
        </div>
      </div>,
      {
        duration: 4000,
        position: 'top-right',
      }
    );
  }, [enabled, showToast]);

  const notify = useCallback((senderName: string, message: string, avatarUrl?: string) => {
    playNotificationSound();
    showNotificationToast(senderName, message, avatarUrl);
  }, [playNotificationSound, showNotificationToast]);

  return {
    notify,
    playNotificationSound,
    showNotificationToast,
  };
};
