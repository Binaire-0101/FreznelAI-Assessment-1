/**
 * OOP Debouncer Class
 * Delays execution of a function until after `delayMs` milliseconds have elapsed
 * since the last time it was invoked.
 */
export class Debouncer {
  private timer: number | null = null;
  private lastArgs: any[] | null = null;
  private pendingFn: ((...args: any[]) => void) | null = null;

  /**
   * Schedule debounced function execution
   */
  public execute<T extends (...args: any[]) => any>(
    fn: T,
    delayMs: number,
    ...args: Parameters<T>
  ): void {
    this.cancel();
    this.pendingFn = fn;
    this.lastArgs = args;

    this.timer = window.setTimeout(() => {
      if (this.pendingFn && this.lastArgs) {
        this.pendingFn(...this.lastArgs);
      }
      this.clear();
    }, delayMs);
  }

  /**
   * Cancel pending debounced execution
   */
  public cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Immediately execute any pending debounced call
   */
  public flush(): void {
    if (this.timer !== null && this.pendingFn && this.lastArgs) {
      clearTimeout(this.timer);
      this.pendingFn(...this.lastArgs);
      this.clear();
    }
  }

  private clear(): void {
    this.timer = null;
    this.lastArgs = null;
    this.pendingFn = null;
  }
}
