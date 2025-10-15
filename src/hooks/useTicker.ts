import { useEffect, useRef } from 'react';

export function useTicker(callback: (dt: number) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    let animationFrame: number;
    let last = performance.now();

    const tick = (time: number) => {
      const dt = Math.max(0, (time - last) / 1000);
      last = time;
      callbackRef.current(dt);
      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);
}

export function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      saved.current();
    }, delay);

    return () => clearInterval(id);
  }, [delay]);
}
