/**
 * OOP Throttler Class
 * Ensures function is called at most once per `limitMs` milliseconds.
 */
export class Throttler {
  private lastExecutedTime: number = 0;
  private timer: number | null = null;
  private pendingFn: ((...args: any[]) => void) | null = null;
  private lastArgs: any[] | null = null;

  /**
   * Execute or queue function invocation with throttling
   */
  public execute<T extends (...args: any[]) => any>(
    fn: T,
    limitMs: number,
    ...args: Parameters<T>
  ): void {
    const now = Date.now();
    const remainingTime = limitMs - (now - this.lastExecutedTime);

    this.pendingFn = fn;
    this.lastArgs = args;

    if (remainingTime <= 0 || remainingTime > limitMs) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      this.lastExecutedTime = now;
      fn(...args);
      this.pendingFn = null;
      this.lastArgs = null;
    } else if (this.timer === null) {
      this.timer = window.setTimeout(() => {
        this.lastExecutedTime = Date.now();
        this.timer = null;
        if (this.pendingFn && this.lastArgs) {
          this.pendingFn(...this.lastArgs);
          this.pendingFn = null;
          this.lastArgs = null;
        }
      }, remainingTime);
    }
  }

  /**
   * Cancel pending throttled execution
   */
  public cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingFn = null;
    this.lastArgs = null;
  }
}
