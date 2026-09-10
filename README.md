# Model Atlas

Model selection utility for the Binaire Private Limited JavaScript assessment.

## Run locally

```bash
npm install
npm run dev
```

Validation commands:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Features

- React + TypeScript + Adobe Spectrum interface.
- Firebase email/password sign-up, sign-in, and sign-out when Firebase variables are configured.
- Search by model name, repository ID, or family with debounced input.
- Pipeline, architecture, family-tag, and weight-format filters.
- Safetensor count range filtering and name/count sorting.
- Cache-first loading with IndexedDB, live background refresh, and online/offline status.
- Promise-based background fetching without `async`/`await`.

## Environment

Copy `.env.example` to `.env.local` and provide the Firebase web app values:

```text
VITE_MODEL_API_URL=https://binaire.app/hf-models-api.json
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Without Firebase variables, the UI exposes a local preview path for development. Production access is Firebase-authenticated.

The API response is expected to be an object with a `models` array. Safetensor counts are normalized from strings; `TBD` is retained as an unknown value and excluded from numeric range comparisons.

## Offline and download safety

The app displays cached models immediately, then refreshes in the background when online. A complete response is parsed and schema-validated before it is written to IndexedDB. The previous snapshot remains intact when a request, JSON parse, or validation step fails, so a partial or corrupted download cannot replace the last known-good catalogue.

## Assessment release checklist

- Configure Firebase Auth and verify sign-up/sign-in flows.
- Deploy the production build and add the hosted URL here.
- Use GitHub CLI to star the supplied source repository and fork it as `Binaire-FreznelAI-Assessment`.
- Publish the final project as `Binaire_Freznel_Assessment` using the assessment's supplied repository URLs.
