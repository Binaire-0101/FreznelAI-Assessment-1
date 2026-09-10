import { ModelRepository } from './ModelRepository.js';
import { AuthService } from '../auth/AuthService.js';
import { DEFAULT_API_BASE } from '../api/ModelApiClient.js';

/**
 * Service container.
 *
 * The domain layer is deliberately framework-free, so something has to own the
 * long-lived instances and hand them to React. Doing it here (rather than in a
 * `useState` inside a component) means the repository survives React 18's
 * double-mounted StrictMode effects and hot reloads without re-downloading the
 * catalogue or losing the auth listener.
 */
export class ServiceContainer {
  constructor() {
    this.apiBase = import.meta.env.VITE_MODEL_API_BASE || DEFAULT_API_BASE;
    this.pages = Number(import.meta.env.VITE_MODEL_PAGES || 3);

    this.repository = new ModelRepository({ baseUrl: this.apiBase, pages: this.pages });
    this.auth = new AuthService();

    this._started = false;
  }

  start() {
    if (this._started) return this;
    this._started = true;
    this.auth.start();
    this.repository.start();
    return this;
  }
}

export const services = new ServiceContainer();
