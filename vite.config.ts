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
    rollupOptions: {
      output: {
        // Smart chunk strategy — split by library family for long-term caching
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-router")) return "react-router";
          if (id.includes("react-dom") || id.match(/[\\/]react[\\/]/)) return "react-vendor";
          if (id.includes("@radix-ui")) return "radix-ui";
          if (id.includes("@tanstack")) return "query-vendor";
          if (id.includes("@supabase")) return "supabase-vendor";
          // Keep Recharts/D3 with the route chunk that imports it. Splitting these
          // internals into a shared manual chunk can create production-only TDZ
          // crashes in the published app (blank page before React mounts).
          if (id.includes("framer-motion")) return "animation-vendor";
          if (id.includes("lucide-react")) return "icons-vendor";
          if (id.includes("date-fns")) return "date-vendor";
          if (id.includes("cmdk")) return "cmdk-vendor";
          if (id.includes("react-helmet")) return "helmet-vendor";
          if (
            id.includes("clsx") ||
            id.includes("tailwind-merge") ||
            id.includes("class-variance-authority") ||
            id.includes("zod")
          )
            return "utils-vendor";
        },
      },
    },
    chunkSizeWarningLimit: 600,
    minify: "esbuild",
    target: "es2020",
    sourcemap: mode === "development",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: false,
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
