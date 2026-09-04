import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Avoid custom vendor chunk splitting: forced manual chunks caused
    // production-only TDZ crashes before React could mount, leaving the site blank.
    chunkSizeWarningLimit: 600,
    minify: "esbuild",
    cssMinify: "esbuild",
    target: "es2020",
    sourcemap: mode === "development",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
  },
  esbuild: {
    // Strip debug logging from production bundles for a smaller, faster payload.
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
      "recharts",
      "lodash/get",
      "sonner",
    ],
    exclude: ["framer-motion"],
  },
}));
