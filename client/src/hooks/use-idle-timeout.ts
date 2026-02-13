import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimeoutOptions {
  /**
   * Timeout duration in milliseconds
   * Default: 60 minutes (3600000ms)
   */
  timeout?: number;

  /**
   * Warning duration in milliseconds (before timeout)
   * Default: 2 minutes (120000ms)
   */
  warningDuration?: number;

  /**
   * Callback when user becomes idle (after timeout)
   */
  onIdle?: () => void;

  /**
   * Callback when warning period starts
   */
  onWarning?: () => void;

  /**
   * Whether idle timeout is enabled
   */
  enabled?: boolean;
}

export function useIdleTimeout({
  timeout = 60 * 60 * 1000, // 60 minutes default
  warningDuration = 2 * 60 * 1000, // 2 minutes default
  onIdle,
  onWarning,
  enabled = true,
}: UseIdleTimeoutOptions = {}) {
  const [isIdle, setIsIdle] = useState(false);
  const [isWarning, setIsWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(timeout);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    clearTimers();
    setIsIdle(false);
    setIsWarning(false);
    lastActivityRef.current = Date.now();
    setRemainingTime(timeout);

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      setIsWarning(true);
      if (onWarning) {
        onWarning();
      }

      // Start countdown interval during warning period
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - lastActivityRef.current;
        const remaining = Math.max(0, timeout - elapsed);
        setRemainingTime(remaining);

        if (remaining === 0) {
          clearInterval(intervalRef.current);
        }
      }, 1000); // Update every second

    }, timeout - warningDuration);

    // Set idle timeout
    timeoutRef.current = setTimeout(() => {
      setIsIdle(true);
      setIsWarning(false);
      clearInterval(intervalRef.current);
      if (onIdle) {
        onIdle();
      }
    }, timeout);
  }, [enabled, timeout, warningDuration, onIdle, onWarning, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      return;
    }

    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Reset timer on activity
    const handleActivity = () => {
      resetTimer();
    };

    // Attach event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [enabled, resetTimer, clearTimers]);

  return {
    isIdle,
    isWarning,
    remainingTime,
    resetTimer,
  };
}
