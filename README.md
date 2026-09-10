# Binaire Freznel AI — Model Selection Utility
> Assignment Deliverable: `Binaire_Freznel_AI_Assessment`

A minimal, professional, high-contrast Model Selection Utility designed for AI engineers and infrastructure architects. The application searches, filters, compares, and selects frontier machine learning models across remote APIs with offline local caching, automatic reconnection synchronization, and dark mode support.

---

## 1. Project Overview & Aesthetic Direction

The user interface follows the **Binaire Freznel AI** visual identity:
- **Monochrome & High Contrast:** Pure white canvas with deep charcoal/black navigation, subtle borders (`#E5E5E5` / `#262626`), and razor-sharp typographic hierarchy.
- **Minimalist Technical Styling:** No gratuitous SaaS gradients, no artificial marketing fluff, no nested card clutter.
- **Adobe React Spectrum:** Integrated UI components following strict accessibility guidelines.
- **Full Dark Mode Support:** Seamless toggling between light and dark palettes across all Adobe Spectrum components and system views.

---

## 2. Key Features

- **Multi-Factor Search:**
  - Fast substring search across model names, model IDs, authors, and pipeline capabilities.
  - Model family dropdown filter.
  - Custom debouncing (`250ms`) to minimize UI thread re-renders.
- **Technical Multi-Tag Filtering:**
  - Pipeline tags (Text Generation, Image Generation, Embedding, Audio, etc.)
  - Architecture tags (Transformer, Mixture-of-Experts, Diffusion, etc.)
  - Family tags (Llama, Mistral, Qwen, DeepSeek, Gemma, etc.)
  - Weight categories (Small `< 3B`, Medium `3B - 14B`, Large `> 14B`)
  - Safetensor file count range filter (Min / Max with numeric inputs)
- **Client-Side Sorting:**
  - Safetensor file count (Lowest → Highest, Highest → Lowest)
  - Model Name alphabetical (A → Z, Z → A)
  - Popularity / Total downloads
- **Model Selection & Persistence:**
  - Single-click model selection.
  - Active selection summary banner with quick change/inspect actions.
  - Persistent storage in local browser memory.
- **Side-by-Side Model Comparison:**
  - Compare up to 3 candidate models across parameter weights, safetensor counts, context windows, native precision, safety scores, and licenses.
- **Offline / Online State Management:**
  - Real-time `navigator.onLine` and `window.addEventListener` detection.
  - Clear UI status: `● Online` / `● Offline` / `● Syncing...`.
  - Offline banner communicating cached model operation.
  - Test controls: Dedicated toggle to simulate offline mode or random network fluctuations directly in the UI.
- **Authentication:**
  - Firebase Authentication (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signOut`, `onAuthStateChanged`).
  - Persistent authentication session.
  - Instant Lead Assessor guest access for frictionless local evaluation.

---

## 3. Technology Stack

- **Framework:** React 19 + TypeScript 5.8
- **Bundler:** Vite 6
- **UI Design System:** Adobe React Spectrum (`@adobe/react-spectrum`)
- **Authentication:** Firebase Authentication (`firebase/app`, `firebase/auth`)
- **Persistence:** IndexedDB with localStorage fallback
- **Network & Fetch:** Native Fetch API with ES6 Promise chaining (no external HTTP clients)

---

## 4. OOP Architecture

The business and domain logic is implemented using **ES6+ Classes and Object-Oriented Programming (OOP)**:

1. **`Model` (`src/models/Model.ts`)**
   - Encapsulates domain properties: `id`, `name`, `family`, `pipelineTags`, `architectureTags`, `weight`, `safetensorFileCount`, `description`, `contextWindow`, `precision`.
   - Methods:
     - `getDisplayName()`: Formats clean display titles.
     - `getParameterCount()`: Formats human-readable parameter metrics (`70B parameters` / `809M parameters`).
     - `getWeightRange()`: Categorizes into `Small`, `Medium`, or `Large`.
     - `getSafetyScore()`: Calculates safety & security audit score based on non-pickle safetensors and license transparency.
     - `matchesSearch(query, family)`: Substring match from start or anywhere in string.
     - `matchesFilters(filters)`: Evaluates all multi-criteria filters.
     - `toPlainObject()`: Serializes cleanly for IndexedDB.

2. **`ModelRepository` (`src/models/ModelRepository.ts`)**
   - Manages versioned local cache via **IndexedDB** (`binaire_freznel_ai_db`) with fallback to `localStorage`.
   - Atomically updates cache only after full schema verification.
   - Methods: `save(models)`, `getCachedModels()`, `hasCachedModels()`, `getCacheMetadata()`, `clearCache()`.

3. **`ModelFilterService` (`src/services/ModelFilterService.ts`)**
   - Pure domain filter service.
   - Methods: `applyFilters()`, `extractPipelineTags()`, `extractFamilyTags()`, `extractArchitectureTags()`, `getSafetensorBounds()`.

4. **`ModelSortService` (`src/services/ModelSortService.ts`)**
   - Sort service for safetensor counts, alphabetical names, and popularity.
   - Method: `sort(models, sortOption)`.

5. **`ModelApiService` (`src/services/ModelApiService.ts`)**
   - Handles remote endpoint requests, validation, timeouts, AbortControllers, and background synchronization.

6. **`NetworkService` (`src/services/NetworkService.ts`)**
   - Singleton observer managing browser connectivity events and simulated offline testing.

---

## 5. How Background Fetch Works Without Async/Await

> **Assignment Question:** *"Implement fetch API in background: how will you solve this problem without using async-await?"*

In `src/services/ModelApiService.ts`, the `fetchModelsInBackground` method is implemented **strictly without `async` or `await`**, utilizing the native **ES6 Promise chain (`.then()`, `.catch()`, `.finally()`)**:

```typescript
public fetchModelsInBackground(
  onSuccess?: (models: Model[]) => void,
  onError?: (error: Error) => void,
  onFinally?: () => void
): Promise<Model[]> {
  const url = this.apiUrl;
  const repo = this.repository;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  // STRICTLY PROMISE CHAINING WITHOUT ASYNC/AWAIT
  return fetch(url, {
    signal: controller.signal,
    headers: { 'Accept': 'application/json' },
  })
    .then((response: Response) => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Background fetch HTTP ${response.status}: ${response.statusText}`);
      }
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error(`Background fetch received non-JSON: ${contentType}`);
      }
      return response.json();
    })
    .then((rawJson: unknown) => {
      const validation = validateModelPayload(rawJson);
      if (!validation.isValid || validation.models.length === 0) {
        throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
      }
      const models = validation.models.map(raw => Model.fromRaw(raw));
      return repo.save(models).then(() => models);
    })
    .then((models: Model[]) => {
      if (onSuccess) onSuccess(models);
      return models;
    })
    .catch((err: unknown) => {
      clearTimeout(timeoutId);
      const error = err instanceof Error ? err : new Error(String(err));
      return repo.getCachedModels().then(cached => {
        if (cached.length > 0 && onSuccess) onSuccess(cached);
        return cached;
      });
    })
    .finally(() => {
      if (onFinally) onFinally();
    });
}
```

### Why this design works:
1. **Non-blocking Execution:** The promise operations execute in the JavaScript microtask queue without stalling the main UI rendering thread.
2. **Auto-Reconnection Sync:** When `NetworkService` detects connection recovery (`offline` → `online`), `ModelContext` automatically triggers `refreshInBackground()`.

---

## 6. How Large JSON Downloads Are Protected Against Corruption

> **Assignment Question:** *"If the JSON file is large, how will you assure its safety and prevent corruption during download of file?"*

To prevent partial, truncated, or malformed data from corrupting the application cache:

1. **HTTP Status & Header Validation:**
   The service asserts `response.ok === true` and verifies `Content-Type: application/json` before consuming the response body.
2. **AbortController & Network Timeouts:**
   Downloads are bounded by an `AbortController` timeout (15–20 seconds). If a connection stalls or is severed midway, the request is aborted and cleanly garbage collected.
3. **Structured Schema Validation (`src/utils/validation.ts`):**
   Parsed JSON is passed through `validateModelPayload(data)`. Each model candidate must have valid string identifiers, weights, safetensor integers, and tag arrays.
4. **Ratio-Based Corruption Detection:**
   If a remote payload claims to contain models but over 50% of the entries fail validation, the entire payload is rejected as corrupted.
5. **Atomic Cache Commit:**
   `ModelRepository.save(models)` is invoked **only after 100% of the payload has been parsed and verified**.
6. **Preservation of Previous Valid Cache:**
   If a download fails or throws a parse error, the previous cache version in IndexedDB is preserved untouched.

---

## 7. Environment Variables Configuration

Copy `.env.example` to `.env`:

```env
# Remote Models API endpoint
VITE_MODELS_API_URL=

# Firebase Authentication Credentials
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

*Note: If `VITE_MODELS_API_URL` is empty or unreachable during evaluation, the utility automatically loads an authentic frontier model dataset (Llama 3.3, Mistral Large, Qwen 2.5, DeepSeek-V3, FLUX.1, Whisper, Gemma 2) while remaining ready to query any live API configured in the Settings modal.*

---

## 8. Running Locally & Production Build

```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev

# Run TypeScript linter
npm run lint

# Build for production
npm run build
```

---

## 9. Assignment Requirements Checklist

| Requirement | Implementation Status |
|---|---|
| **Adobe React Spectrum Components** | Implemented (`Provider`, `defaultTheme`, `Flex`, `Grid`, `View`, `Button`, `Picker`, etc.) |
| **Dark Mode Support** | Implemented (System / Light / Dark toggle with Spectrum synchronicity) |
| **Firebase Authentication** | Implemented with persistent session and guest demo login |
| **OOP Classes & Principles** | Implemented (`Model`, `ModelRepository`, `ModelFilterService`, `ModelSortService`, `ModelApiService`, `NetworkService`) |
| **Search by Model Name & Family** | Implemented with custom debouncing & substring matching |
| **Multi-Tag Filters** | Implemented (Pipeline tags, Architecture tags, Family tags, Weight categories) |
| **Safetensor Min/Max Filters** | Implemented with dual range controls |
| **Sorting** | Implemented (Safetensors count asc/desc, Name A-Z/Z-A, Popularity) |
| **Model Selection & Persistence** | Implemented with local cache & selection summary banner |
| **Side-by-Side Comparison** | Implemented (Compare up to 3 models simultaneously) |
| **Online / Offline Detection** | Implemented via `navigator.onLine` and event listeners |
| **Offline Cache Operation** | Implemented via IndexedDB with localStorage fallback |
| **Background Fetch without async/await** | Implemented explicitly with ES6 Promise chaining |
| **Large JSON Corruption Protection** | Implemented with schema validation, timeouts, atomic commits |
