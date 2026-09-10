import { NetworkState } from '../types';

type Listener = (state: NetworkState) => void;

/**
 * OOP NetworkStatusManager Class
 * Monitors real online/offline browser state and supports simulated offline testing mode.
 */
export class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private listeners: Set<Listener> = new Set();
  private isSimulatedOffline: boolean = false;
  private isBrowserOnline: boolean = navigator.onLine;

  private constructor() {
    window.addEventListener('online', this.handleOnlineChange);
    window.addEventListener('offline', this.handleOnlineChange);
  }

  public static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }

  private handleOnlineChange = () => {
    this.isBrowserOnline = navigator.onLine;
    this.notify();
  };

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public toggleSimulatedOffline(): boolean {
    this.isSimulatedOffline = !this.isSimulatedOffline;
    this.notify();
    return this.isSimulatedOffline;
  }

  public setSimulatedOffline(status: boolean): void {
    this.isSimulatedOffline = status;
    this.notify();
  }

  public getState(): NetworkState {
    const isEffectiveOnline = this.isBrowserOnline && !this.isSimulatedOffline;
    return {
      isOnline: isEffectiveOnline,
      isSimulatedOffline: this.isSimulatedOffline,
      lastChecked: new Date().toLocaleTimeString()
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }
}
