import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

// ── Item 10: Sentry frontend init ───────────────────────────────────────────
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^\/api/],
  enabled: !!import.meta.env.VITE_SENTRY_DSN,
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error(
    "VITE_CLERK_PUBLISHABLE_KEY is missing. Check your .env file."
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "system-ui", padding: "2rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#666", marginBottom: "1rem" }}>Please hard-refresh (Ctrl+Shift+R) or restart the dev server.</p>
        <button onClick={() => window.location.reload()} style={{ padding: "0.5rem 1.5rem", background: "#10b981", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}>Reload</button>
      </div>
    }>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
        <App />
      </ClerkProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
);
