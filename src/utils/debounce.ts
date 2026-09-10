/**
 * Custom debouncing implementation without heavy external libraries.
 * Delays invoking func until after delayMs milliseconds have elapsed since
 * the last time the debounced function was invoked.
 */

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  delayMs: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      func(...args);
      timerId = null;
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}
