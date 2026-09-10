# Binaire-FreznelAI-Assessment

Minimal React + TypeScript model selector using OOP service classes, Firebase email/password authentication, Hugging Face model search, filters, sorting, offline cache and online/offline status.

## Setup

1. Copy `.env.example` to `.env` and enter a Firebase Web app configuration.
2. Enable Email/Password authentication in Firebase.
3. Run `npm install` then `npm run dev`.

The model API defaults to `https://huggingface.co/api/models?limit=500&full=true` and can be changed through `VITE_MODELS_API_URL`.

Network requests use Promise chaining without `async`/`await`. A response is size-limited, fully parsed and schema-checked before replacing the last known valid cache, so interrupted or malformed downloads cannot corrupt offline data.
