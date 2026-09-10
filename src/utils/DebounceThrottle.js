/**
 * Rate-limiting primitives, as classes so they can be owned, inspected and
 * cancelled by the object that created them (a bare closure cannot be asked
 * "are you pending?" or told "flush now").
 */

/**
 * Debouncer - collapses a burst of calls into the last one.
 * Used for the search box: no work happens until typing pauses.
 */
export class Debouncer {
  constructor(fn, delay = 250) {
    this.fn = fn;
    this.delay = delay;
    this._timer = null;
    this._lastArgs = null;
  }

  get pending() {
    return this._timer !== null;
  }

  call(...args) {
    this._lastArgs = args;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      this._timer = null;
      this.fn(...args);
    }, this.delay);
  }

  /** Run the queued call immediately (e.g. the user pressed Enter). */
  flush() {
    if (!this.pending) return;
    clearTimeout(this._timer);
    this._timer = null;
    this.fn(...this._lastArgs);
  }

  cancel() {
    clearTimeout(this._timer);
    this._timer = null;
  }
}

/**
 * Throttler - guarantees at most one call per window, leading edge, with the
 * final call in a window replayed on the trailing edge so nothing is lost.
 */
export class Throttler {
  constructor(fn, interval = 600) {
    this.fn = fn;
    this.interval = interval;
    this._lastRun = 0;
    this._timer = null;
    this._trailingArgs = null;
  }

  call(...args) {
    const now = Date.now();
    const elapsed = now - this._lastRun;

    if (elapsed >= this.interval) {
      this._lastRun = now;
      this.fn(...args);
      return;
    }

    // Inside the window: remember the newest arguments and make sure exactly
    // one trailing invocation is scheduled for when the window closes.
    this._trailingArgs = args;
    if (this._timer) return;
    this._timer = setTimeout(() => {
      this._timer = null;
      this._lastRun = Date.now();
      const trailing = this._trailingArgs;
      this._trailingArgs = null;
      if (trailing) this.fn(...trailing);
    }, this.interval - elapsed);
  }

  cancel() {
    clearTimeout(this._timer);
    this._timer = null;
    this._trailingArgs = null;
  }
}

/**
 * SearchScheduler - the combination the search box actually needs.
 *
 * Debouncing alone feels dead during sustained typing (nothing updates until
 * you stop). Throttling alone fires far too often on fast typists. So we run
 * both: the debouncer delivers the settled query, while the throttler
 * guarantees the result list still refreshes at least every `interval` ms while
 * keys keep coming. Whichever fires first wins, and a duplicate query is
 * dropped so the expensive work never runs twice for the same input.
 */
export class SearchScheduler {
  constructor(fn, { debounce = 220, throttle = 600 } = {}) {
    this._deliver = (value) => {
      if (value === this._lastDelivered) return;
      this._lastDelivered = value;
      fn(value);
    };
    this._lastDelivered = null;
    this.debouncer = new Debouncer(this._deliver, debounce);
    this.throttler = new Throttler(this._deliver, throttle);
  }

  schedule(value) {
    this.debouncer.call(value);
    this.throttler.call(value);
  }

  /** Bypass both timers - used for Enter and for filter changes. */
  immediate(value) {
    this.cancel();
    this._lastDelivered = null; // force delivery even if the value is unchanged
    this._deliver(value);
  }

  cancel() {
    this.debouncer.cancel();
    this.throttler.cancel();
  }
}

/** Static helpers, kept for call sites that just want a wrapped function. */
export class DebounceThrottle {
  static debounce(fn, delay = 250) {
    const debouncer = new Debouncer(fn, delay);
    return (...args) => debouncer.call(...args);
  }

  static throttle(fn, interval = 600) {
    const throttler = new Throttler(fn, interval);
    return (...args) => throttler.call(...args);
  }
}
