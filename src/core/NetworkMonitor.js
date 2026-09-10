import { EventEmitter } from './EventEmitter.js';

/**
 * Tracks connectivity and tells the UI about it.
 *
 * `navigator.onLine` alone is not trustworthy - it only reports whether the
 * machine has *a* network interface, not whether the API is reachable (captive
 * portals, VPN drops, and a laptop on a dead Wi-Fi network all report `true`).
 * So this class combines three signals:
 *
 *   1. the `online` / `offline` DOM events, for instant reaction;
 *   2. `navigator.onLine`, as the cheap baseline;
 *   3. a periodic lightweight reachability probe against the API itself.
 *
 * Emits `change` with `{ online, reason, since }` whenever the effective state
 * flips, which is what drives the status pill and the offline banner.
 */
export class NetworkMonitor extends EventEmitter {
  /**
   * @param {object} options
   * @param {string} options.probeUrl   tiny endpoint used for reachability
   * @param {number} options.interval   probe cadence in ms while online
   * @param {number} options.offlineInterval faster cadence while offline
   */
  constructor({ probeUrl = '', interval = 30000, offlineInterval = 5000 } = {}) {
    super();
    this.probeUrl = probeUrl;
    this.interval = interval;
    this.offlineInterval = offlineInterval;

    this._online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
    this._since = Date.now();
    this._timer = null;
    this._started = false;

    this._handleOnline = () => this._apply(true, 'browser-event');
    this._handleOffline = () => this._apply(false, 'browser-event');
  }

  get online() {
    return this._online;
  }

  get state() {
    return { online: this._online, since: this._since };
  }

  start() {
    if (this._started) return this;
    this._started = true;
    window.addEventListener('online', this._handleOnline);
    window.addEventListener('offline', this._handleOffline);
    this._scheduleProbe(0);
    return this;
  }

  stop() {
    this._started = false;
    window.removeEventListener('online', this._handleOnline);
    window.removeEventListener('offline', this._handleOffline);
    clearTimeout(this._timer);
    this._timer = null;
  }

  /** Force an immediate reachability check (used by the "Retry" button). */
  probeNow() {
    return this._probe();
  }

  _scheduleProbe(delayMs) {
    clearTimeout(this._timer);
    const wait = delayMs === undefined ? (this._online ? this.interval : this.offlineInterval) : delayMs;
    this._timer = setTimeout(() => {
      this._probe().then(() => {
        if (this._started) this._scheduleProbe();
      });
    }, wait);
  }

  _probe() {
    // No probe endpoint configured, or the browser is already certain we are
    // offline: trust the cheap signal and skip the request entirely.
    if (!this.probeUrl || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      this._apply(typeof navigator === 'undefined' ? true : navigator.onLine !== false, 'navigator');
      return Promise.resolve(this._online);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    return fetch(this.probeUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        clearTimeout(timer);
        // Any HTTP answer at all proves the network path works, even a 4xx.
        this._apply(true, `probe:${response.status}`);
        return true;
      })
      .catch(() => {
        clearTimeout(timer);
        this._apply(false, 'probe-failed');
        return false;
      });
  }

  _apply(online, reason) {
    if (online === this._online) return;
    this._online = online;
    this._since = Date.now();
    this.emit('change', { online, reason, since: this._since });
    // Flip the cadence: while offline we poll more eagerly so the UI recovers
    // as soon as the connection comes back.
    if (this._started) this._scheduleProbe();
  }
}
