import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // listen on all interfaces so Docker port mapping works
    port: 5173,
    hmr: {
      overlay: false,
    },
    // In dev, proxy /api to backend so the app works without CORS and with backend in Docker (backend:8080) or on host (localhost:8080)
    proxy:
      mode === "development"
        ? {
            "/api": {
              target: process.env.VITE_PROXY_TARGET || "http://localhost:8080",
              changeOrigin: true,
            },
          }
        : undefined,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single copy of React so hooks work (avoids "Invalid hook call" with react-query, etc.)
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
}));
