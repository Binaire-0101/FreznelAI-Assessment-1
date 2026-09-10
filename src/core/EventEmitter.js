/**
 * Minimal synchronous event bus.
 *
 * Every long-lived service in this app (network monitor, repository, auth,
 * background loader) extends this class so React can subscribe to it without
 * the services having to know that React exists.
 */
export class EventEmitter {
  constructor() {
    this._listeners = new Map();
  }

  on(event, handler) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(handler);
    // Returns the unsubscribe function so `useEffect` can return it directly.
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this._listeners.get(event);
    if (set) set.delete(handler);
  }

  emit(event, payload) {
    const set = this._listeners.get(event);
    if (!set) return;
    // Copy before iterating: a handler is allowed to unsubscribe itself.
    for (const handler of Array.from(set)) {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[EventEmitter] listener for "${event}" threw`, error);
      }
    }
  }

  removeAllListeners() {
    this._listeners.clear();
  }
}
