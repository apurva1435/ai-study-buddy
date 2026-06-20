import { useCallback, useEffect, useRef, useState } from "react";

export function useFocusTracker(isSessionActive: boolean) {
  const hiddenStartRef = useRef<number | null>(null);

  const [totalHiddenTime, setTotalHiddenTime] = useState(0);
  const [distractionScore, setDistractionScore] = useState(0);

  const applyScoring = useCallback((duration: number) => {
    setTotalHiddenTime(prev => prev + duration);

    if (duration < 5000) return;
    if (duration < 10000) {
      setDistractionScore(prev => prev + 1);
    } else if (duration < 15000) {
      setDistractionScore(prev => prev + 2);
    } else {
      setDistractionScore(prev => prev + 3);
    }
  }, []);

  const resetFocusTracking = useCallback(() => {
    hiddenStartRef.current = null;
    setTotalHiddenTime(0);
    setDistractionScore(0);
  }, []);

  useEffect(() => {
    if (!isSessionActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenStartRef.current = Date.now();
      } else {
        if (hiddenStartRef.current !== null) {
          const hiddenDuration = Date.now() - hiddenStartRef.current;
          hiddenStartRef.current = null;

          applyScoring(hiddenDuration);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [applyScoring, isSessionActive]);

  return {
    totalHiddenTime,
    distractionScore,
    resetFocusTracking,
  };
}
