import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
    hmr: {
      overlay: true,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ── Item 13: Build optimisation ───────────────────────────────────────────
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) {
            return "vendor-react";
          }
          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/shadcn")
          ) {
            return "vendor-ui";
          }
          if (id.includes("node_modules/@tanstack")) {
            return "vendor-tanstack";
          }
        },
      },
    },
  },
}));
