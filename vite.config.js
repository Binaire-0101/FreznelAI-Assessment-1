import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // The Spectrum and Firebase bundles are large and stable; splitting
        // them out means an app change ships a small chunk while the vendor
        // chunks stay in the browser cache (and in the service worker's asset
        // cache) across deploys.
        manualChunks(id) {
          if (id.includes('node_modules/@adobe') || id.includes('node_modules/@react-')) {
            return 'spectrum';
          }
          if (id.includes('node_modules/@firebase') || id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          return undefined;
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
});
