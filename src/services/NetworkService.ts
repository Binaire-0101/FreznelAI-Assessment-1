/**
 * NetworkService Class managing online/offline connectivity detection,
 * browser network events, and testing simulations.
 *
 * Binaire Freznel AI Assessment - Requirements #8, #17
 */

export type NetworkChangeCallback = (isOnline: boolean) => void;

export class NetworkService {
  private static instance: NetworkService | null = null;
  private listeners: Set<NetworkChangeCallback> = new Set();
  private simulatedOffline: boolean = false;
  private isBrowserOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor() {
    this.setupListeners();
  }

  public static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isBrowserOnline = true;
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isBrowserOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Returns true if both real browser and simulated state are online.
   */
  public isOnline(): boolean {
    if (this.simulatedOffline) {
      return false;
    }
    return this.isBrowserOnline;
  }

  /**
   * Simulates going offline or back online for test evaluations.
   */
  public setSimulatedOffline(offline: boolean): void {
    if (this.simulatedOffline !== offline) {
      this.simulatedOffline = offline;
      this.notifyListeners();
    }
  }

  public isSimulatingOffline(): boolean {
    return this.simulatedOffline;
  }

  /**
   * Toggles simulated offline mode.
   */
  public toggleSimulatedOffline(): boolean {
    this.setSimulatedOffline(!this.simulatedOffline);
    return this.isOnline();
  }

  /**
   * Randomly toggles network status to simulate unstable connectivity (as requested in test criteria).
   */
  public triggerRandomNetworkToggle(): boolean {
    const nextState = Math.random() > 0.5;
    this.setSimulatedOffline(!nextState);
    return this.isOnline();
  }

  /**
   * Subscribes a listener to network status changes.
   */
  public subscribe(callback: NetworkChangeCallback): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    const current = this.isOnline();
    this.listeners.forEach(cb => {
      try {
        cb(current);
      } catch (err) {
        console.error('[NetworkService] Error in subscriber callback:', err);
      }
    });
  }
}
