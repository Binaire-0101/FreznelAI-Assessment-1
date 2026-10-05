import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api/models": {
        target: "https://binaire.app",
        changeOrigin: true,
        rewrite: () => "/hf-models-api.json",
      },
    },
  },
});
