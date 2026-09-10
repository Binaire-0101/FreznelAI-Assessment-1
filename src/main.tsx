import React from 'react';
import { createRoot } from 'react-dom/client';
import type { User } from 'firebase/auth';
import { FirebaseAuth } from './auth/FirebaseAuth';
import { Debouncer, ModelSearch, ModelService } from './models/ModelService';
import type { ApiModel, Filters } from './types/model';
import './styles/app.css';

const initialFilters: Filters = { query: '', pipeline: '', family: '', architecture: '', weight: '', min: '0', max: '', sort: 'az' };

interface State {
  user: User | null;
  authMode: 'signin' | 'signup';
  authError: string;
  models: ApiModel[];
  filters: Filters;
  loading: boolean;
  cached: boolean;
  online: boolean;
}

class App extends React.Component<object, State> {
  private auth = new FirebaseAuth();
  private service = new ModelService();
  private debounce = new Debouncer();

  state: State = { user: null, authMode: 'signup', authError: '', models: [], filters: initialFilters, loading: false, cached: false, online: navigator.onLine };

  componentDidMount(): void {
    window.addEventListener('online', this.onConnection);
    window.addEventListener('offline', this.onConnection);
  }

  componentWillUnmount(): void {
    window.removeEventListener('online', this.onConnection);
    window.removeEventListener('offline', this.onConnection);
  }

  onConnection = (): void => this.setState({ online: navigator.onLine });

  authenticate = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const request = this.state.authMode === 'signup' ? this.auth.signUp(email, password) : this.auth.signIn(email, password);
    request.then((user) => this.setState({ user, authError: '' }, this.loadModels)).catch((error: Error) => this.setState({ authError: error.message }));
  };

  loadModels = (): void => {
    this.setState({ loading: true });
    this.service.fetchModels()
      .then(({ models, cached }) => this.setState({ models, cached }))
      .catch((error: Error) => this.setState({ authError: error.message }))
      .finally(() => this.setState({ loading: false }));
  };

  updateFilter = (name: keyof Filters, value: string): void => {
    this.debounce.run(() => this.setState(({ filters }) => ({ filters: { ...filters, [name]: value } })));
  };

  render(): React.ReactNode {
    if (!this.state.user) return <main className="auth"><form onSubmit={this.authenticate}><h1>FreznelAI</h1><h2>{this.state.authMode === 'signup' ? 'Create account' : 'Sign in'}</h2><input name="email" type="email" placeholder="Email" required /><input name="password" type="password" minLength={6} placeholder="Password" required /><p className="error">{this.state.authError}</p><button type="submit">{this.state.authMode === 'signup' ? 'Sign up' : 'Sign in'}</button><button className="link" type="button" onClick={() => this.setState({ authMode: this.state.authMode === 'signup' ? 'signin' : 'signup' })}>{this.state.authMode === 'signup' ? 'Already have an account?' : 'Create an account'}</button></form></main>;

    const search = new ModelSearch(this.state.models);
    const results = search.run(this.state.filters);
    return <main>
      <header><strong>FreznelAI Model Selector</strong><span className={this.state.online ? 'online' : 'offline'}>{this.state.online ? 'Online' : 'Offline'}{this.state.cached ? ' · cached data' : ''}</span><button onClick={() => this.auth.signOut().then(() => this.setState({ user: null }))}>Sign out</button></header>
      <section className="content"><div className="title"><div><h1>Find a model</h1><p>Search and filter available models.</p></div><button onClick={this.loadModels}>Refresh</button></div>
        <div className="controls">
          <label>Search<input type="search" placeholder="Name, family or tag" onChange={(event) => this.updateFilter('query', event.target.value)} /></label>
          <label>Pipeline<select onChange={(event) => this.updateFilter('pipeline', event.target.value)}><option value="">All</option>{search.options('pipeline').map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Family<select onChange={(event) => this.updateFilter('family', event.target.value)}><option value="">All</option>{search.options('family').map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Architecture<select onChange={(event) => this.updateFilter('architecture', event.target.value)}><option value="">All</option>{search.options('architecture').map((value) => <option key={value}>{value}</option>)}</select></label>
          <label>Weight tag<input placeholder="pytorch, safetensors..." onChange={(event) => this.updateFilter('weight', event.target.value)} /></label>
          <label>SafeTensor min<input type="number" min="0" defaultValue="0" onChange={(event) => this.updateFilter('min', event.target.value)} /></label>
          <label>SafeTensor max<input type="number" min="0" placeholder="Any" onChange={(event) => this.updateFilter('max', event.target.value)} /></label>
          <label>Sort<select onChange={(event) => this.updateFilter('sort', event.target.value)}><option value="az">Name A–Z</option><option value="za">Name Z–A</option><option value="files-asc">Files low–high</option><option value="files-desc">Files high–low</option></select></label>
        </div>
        <p className="count">{this.state.loading ? 'Loading…' : `${results.length} models`}</p>
        <div className="models">{results.slice(0, 100).map((model) => <article key={model.id}><h2>{model.id}</h2><p>{model.family}</p><div><span>{model.pipeline}</span><span>{model.architecture}</span><span>{model.safetensors} SafeTensor files</span></div></article>)}</div>
      </section>
    </main>;
  }
}

createRoot(document.getElementById('root')!).render(<App />);
