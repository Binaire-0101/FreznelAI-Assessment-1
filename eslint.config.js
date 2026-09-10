import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // The service worker runs off the window: no DOM, its own global scope.
    files: ['public/sw.js'],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    // Web Workers get the worker scope (`self`, `postMessage`) instead.
    files: ['src/workers/*.js'],
    languageOptions: { globals: globals.worker },
  },
])
