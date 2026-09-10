import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Heading, Item, Picker, ProgressCircle, TextField } from '@adobe/react-spectrum';
import type { User } from 'firebase/auth';
import { ModelApiClient } from './api/ModelApiClient';
import { AuthService } from './auth/AuthService';
import { firebaseConfigured } from './auth/firebase';
import { ModelCatalog } from './models/ModelCatalog';
import { ModelCache } from './offline/ModelCache';
import type { Model, ModelQuery } from './types/model';

const authService = new AuthService();
const apiClient = new ModelApiClient();
const cache = new ModelCache();
const defaultQuery: ModelQuery = {
  search: '', family: '', pipelineTags: [], familyTags: [], architectureTags: [], weightTags: [],
  minSafetensors: 0, maxSafetensors: 1000, sort: 'name-asc',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState(false);
  const [authChecked, setAuthChecked] = useState(!firebaseConfigured);

  useEffect(() => authService.subscribe((nextUser) => { setUser(nextUser); setAuthChecked(true); }), []);

  if (!authChecked) return <LoadingScreen label="Checking your workspace" />;
  if (!user && !preview) return <AuthScreen onPreview={() => setPreview(true)} />;
  return <CatalogueScreen user={user} onSignOut={() => { setPreview(false); void authService.signOut(); }} />;
}

function LoadingScreen({ label }: { label: string }) {
  return <main className="center-screen"><ProgressCircle aria-label={label} isIndeterminate /><span>{label}</span></main>;
}

function AuthScreen({ onPreview }: { onPreview: () => void }) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    setBusy(true); setError('');
    const action = mode === 'sign-in' ? authService.signIn(email, password) : authService.signUp(email, password);
    action.then(() => setBusy(false)).catch((reason: unknown) => {
      setBusy(false); setError(reason instanceof Error ? reason.message : 'Authentication failed.');
    });
  };

  return <main className="auth-screen">
    <section className="auth-copy">
      <span className="kicker">BINAIRE / MODEL ATLAS</span>
      <Heading level={1}>A sharper way to choose a model.</Heading>
      <p>Compare capability, architecture, and storage footprint in one calm workspace.</p>
      <div className="auth-index"><span>01</span><span>CATALOGUE / 2026</span></div>
    </section>
    <section className="auth-panel">
      <span className="panel-label">{mode === 'sign-in' ? 'WELCOME BACK' : 'CREATE ACCESS'}</span>
      <h2>{mode === 'sign-in' ? 'Sign in to your atlas' : 'Open your atlas'}</h2>
      <TextField label="Email" type="email" value={email} onChange={setEmail} width="100%" />
      <TextField label="Password" type="password" value={password} onChange={setPassword} width="100%" />
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button variant="accent" onPress={submit} isDisabled={busy || !email || !password} width="100%">
        {busy ? 'Connecting...' : mode === 'sign-in' ? 'Enter workspace' : 'Create account'}
      </Button>
      <button className="text-button" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); }}>
        {mode === 'sign-in' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
      </button>
      {!firebaseConfigured && <>
        <div className="config-note">Firebase credentials are not configured in this environment.</div>
        <button className="preview-button" onClick={onPreview}>Preview catalogue locally</button>
      </>}
    </section>
  </main>;
}

function CatalogueScreen({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  const [models, setModels] = useState<Model[]>([]);
  const [selected, setSelected] = useState<Model | null>(null);
  const [query, setQuery] = useState<ModelQuery>(defaultQuery);
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(!navigator.onLine);
  const [source, setSource] = useState<'live' | 'cache' | 'preview'>('live');
  const refreshLock = useRef(false);

  const load = (background = false) => {
    if (refreshLock.current) return;
    refreshLock.current = true;
    if (background) setRefreshing(true); else setLoading(true);
    apiClient.fetchModels().then((freshModels) => {
      setModels(freshModels); setSource('live'); setError('');
      return cache.write(freshModels);
    }).catch(() => cache.read().then((snapshot) => {
      if (snapshot) { setModels(snapshot.models); setSource('cache'); setError('Live refresh unavailable. Showing the last saved catalogue.'); }
      else setError('Unable to load models. Check your connection and try again.');
    }).catch(() => setError('Unable to read the offline catalogue.'))).finally(() => {
      refreshLock.current = false; setLoading(false); setRefreshing(false);
    });
  };

  useEffect(() => {
    cache.read().then((snapshot) => {
      if (snapshot) { setModels(snapshot.models); setSource('cache'); setLoading(false); }
      load(true);
    }).catch(() => load());
    const goOnline = () => { setOffline(false); load(true); };
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline); window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery((current) => ({ ...current, search: searchInput })), 280);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const catalog = useMemo(() => new ModelCatalog(models), [models]);
  const facets = useMemo(() => catalog.facets(), [catalog]);
  const results = useMemo(() => catalog.query({ ...query, maxSafetensors: Math.max(query.maxSafetensors, facets.maxSafetensors) }), [catalog, query, facets.maxSafetensors]);

  const toggle = (key: 'pipelineTags' | 'familyTags' | 'architectureTags' | 'weightTags', value: string) => {
    setQuery((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));
  };

  return <main className="workspace">
    <header className="topbar"><div><span className="kicker">BINAIRE / MODEL ATLAS</span><h1>Model catalogue</h1></div><div className="top-actions"><span className={`connection ${offline ? 'is-offline' : ''}`}><i />{offline ? 'Offline' : source === 'cache' ? 'Cached data' : 'Live data'}</span>{refreshing && <span className="refreshing">Updating...</span>}<Button variant="secondary" onPress={onSignOut}>{user ? 'Sign out' : 'Exit preview'}</Button></div></header>
    <section className="search-row"><TextField aria-label="Search models" placeholder="Search by name, ID, or family" value={searchInput} onChange={setSearchInput} width="100%" /><Button variant="secondary" onPress={() => load(true)} isDisabled={offline}>Refresh catalogue</Button></section>
    <div className="workspace-grid">
      <aside className="filter-rail"><div className="rail-heading"><span className="panel-label">FILTERS</span><button className="clear-button" onClick={() => setQuery(defaultQuery)}>Clear all</button></div><FacetGroup title="Pipeline" values={facets.pipelineTags} selected={query.pipelineTags} onToggle={(value) => toggle('pipelineTags', value)} /><FacetGroup title="Architecture" values={facets.architectureTags} selected={query.architectureTags} onToggle={(value) => toggle('architectureTags', value)} /><FacetGroup title="Weight format" values={facets.weightTags} selected={query.weightTags} onToggle={(value) => toggle('weightTags', value)} /><label className="range-label">Safetensor files <span>{query.minSafetensors} - {query.maxSafetensors}</span></label><input type="range" min="0" max={Math.max(facets.maxSafetensors, 1)} value={query.minSafetensors} onChange={(event) => setQuery({ ...query, minSafetensors: Number(event.target.value) })} /><input type="range" min="0" max={Math.max(facets.maxSafetensors, 1)} value={Math.max(query.maxSafetensors, facets.maxSafetensors)} onChange={(event) => setQuery({ ...query, maxSafetensors: Number(event.target.value) })} /></aside>
      <section className="results-column"><div className="results-header"><div><span className="panel-label">AVAILABLE MODELS</span><strong>{results.length.toString().padStart(2, '0')}</strong></div><Picker label="Sort by" selectedKey={query.sort} onSelectionChange={(key) => setQuery({ ...query, sort: key as ModelQuery['sort'] })}><Item key="name-asc">Name, A to Z</Item><Item key="name-desc">Name, Z to A</Item><Item key="safetensors-asc">Safetensor count, low to high</Item><Item key="safetensors-desc">Safetensor count, high to low</Item></Picker></div>{error && <div className="status-note">{error}</div>}{loading ? <LoadingScreen label="Loading catalogue" /> : <div className="model-list">{results.map((model) => <ModelRow key={model.id} model={model} selected={selected?.id === model.id} onSelect={() => setSelected(model)} />)}{!results.length && <div className="empty-state">No models match these filters.</div>}</div>}</section>
      {selected ? <ModelDetail model={selected} onClose={() => setSelected(null)} /> : <div className="detail-placeholder"><span>SELECT A MODEL</span><p>Choose a row to inspect its architecture, task, and download footprint.</p></div>}
    </div>
  </main>;
}

function FacetGroup({ title, values, selected, onToggle }: { title: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return <fieldset className="facet-group"><legend>{title}</legend>{values.slice(0, 8).map((value) => <label key={value}><input type="checkbox" checked={selected.includes(value)} onChange={() => onToggle(value)} /> <span>{value}</span></label>)}</fieldset>;
}

function ModelRow({ model, selected, onSelect }: { model: Model; selected: boolean; onSelect: () => void }) {
  return <button className={`model-row ${selected ? 'is-selected' : ''}`} onClick={onSelect}><span className="row-index">{model.family.split(' ')[0]}</span><span className="row-name"><strong>{model.displayName}</strong><small>{model.id}</small></span><span className="row-family">{model.useCase}</span><span className="row-count">{model.safetensorFileCount ?? 'TBD'} <small>files</small></span><span className="row-arrow">↗</span></button>;
}

function ModelDetail({ model, onClose }: { model: Model; onClose: () => void }) {
  return <aside className="model-detail"><button className="close-button" onClick={onClose} aria-label="Close model details">×</button><span className="panel-label">MODEL PROFILE</span><h2>{model.displayName}</h2><p className="detail-id">{model.id}</p><div className="detail-stat"><span>Family</span><strong>{model.family}</strong></div><div className="detail-stat"><span>Architecture</span><strong>{model.pytorchArchitecture}</strong></div><div className="detail-stat"><span>Weight format</span><strong>{model.weightFormat}</strong></div><div className="detail-stat"><span>Safetensor files</span><strong>{model.safetensorFileCount ?? 'TBD'}</strong></div><a className="repo-link" href={model.repoUrl} target="_blank" rel="noreferrer">Open Hugging Face repo ↗</a></aside>;
}