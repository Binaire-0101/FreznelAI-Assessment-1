import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { registerServiceWorker } from './offline/registerServiceWorker.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// The app shell has to survive a cold start with no network, so the service
// worker is registered after first paint - it must never delay the UI.
registerServiceWorker();
