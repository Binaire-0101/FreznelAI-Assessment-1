# Model Atlas

Model Atlas is a React + TypeScript model selector built for the Freznel assessment. It loads the hosted Hugging Face model index, searches by name, family, and author, filters by tags and safetensor count, and sorts by name or file count.

## Run locally

1. Copy `.env.example` to `.env.local` and add the Firebase web app values.
2. Enable Email/Password under Firebase Authentication.
3. Run `npm install` and `npm run dev`.

The assessment account can sign in locally during development without Firebase. Set `VITE_ENABLE_DEMO_LOGIN=true` only when a production assessment build explicitly needs it. Any other account uses Firebase authentication, so Firebase configuration is required for those users.

The local assessment login is `nikhil.kumar.yadav.0201@gmail.com` with password `nanashi0210`. It is intended only for the assessment demo and is stored in the client because it is a demo credential, not a production secret.

## Architecture

- `src/api/ModelApi.ts`: promise-based live fetch, payload validation, and background refresh.
- `src/offline/OfflineStore.ts`: IndexedDB snapshot storage. A snapshot is replaced only after the complete JSON response parses and validates, preventing partial-download corruption.
- `src/search/ModelSearchEngine.ts`: class-based filtering and sorting domain logic.
- `src/App.tsx`: authenticated UI, debounced query input, connection status, and responsive controls.

The app falls back to the last validated IndexedDB snapshot when the API is unavailable. It also listens to browser online/offline events and labels the current data source.

The fetch implementation uses Promise chains rather than `async`/`await`, so background refresh can run independently without blocking the UI.

The hosted JSON does not currently provide browser CORS headers. During local development, Vite proxies `/api/models` to `https://binaire.app/hf-models-api.json` so the browser can load the live model list. A production deployment needs the same proxy behavior in its web server or serverless function.

Security notes:

- Firebase configuration values are public client configuration, but `.env.local` is ignored and must never contain server credentials.
- The local assessment account is a demo convenience, not a security boundary. It is disabled in production unless `VITE_ENABLE_DEMO_LOGIN=true` is explicitly set.
- API records are normalized and repository links are restricted to HTTPS Hugging Face URLs before rendering.
- Firestore access is denied by default because this app does not currently use Firestore documents.
- The Firebase Hosting config adds basic browser security headers. Add a deployment-specific Content Security Policy after confirming the final analytics, font, Firebase, and API hosts.
