import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:8080";

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: true,
      },
      proxy: {
        // In local dev, forward frontend /api calls to backend server.
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // ── Item 13: Build optimisation ─────────────────────────────────────────
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
  };
});
