/**
 * Custom throttling implementation without heavy external libraries.
 * Enforces a maximum number of times func can be called over time.
 */

export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastRan = 0;
  let inThrottle = false;
  let lastTimer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (!inThrottle) {
      func(...args);
      lastRan = now;
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limitMs);
    } else {
      lastArgs = args;
      if (lastTimer) clearTimeout(lastTimer);
      lastTimer = setTimeout(() => {
        if (Date.now() - lastRan >= limitMs && lastArgs) {
          func(...lastArgs);
          lastRan = Date.now();
          lastArgs = null;
        }
      }, Math.max(0, limitMs - (now - lastRan)));
    }
  };
}
