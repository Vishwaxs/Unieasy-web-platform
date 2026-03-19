// server/index.js
// Express server for UniEasy admin API.
// Reads env from server/.env.local via dotenv.
import "./loadEnv.js"

// ── Item 6: Env var startup validation ──────────────────────────────────────
const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_PLACES_API_KEY",
  "PORT",
];
const missingEnv = REQUIRED_ENV.filter(k => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("Server will not start. Set the missing variables in server/.env.local");
  process.exit(1);
}

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import logger from "./lib/logger.js";
import "./lib/sentry.js";
import { Sentry } from "./lib/sentry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import adminRoutes from "./adminRoutes.js";
import superadminRoutes from "./superadminRoutes.js";
import merchantRoutes from "./merchantRoutes.js";
import placesRoutes from "./placesRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import reactionRoutes from "./reactionRoutes.js";
import sentimentRoutes from "./sentimentRoutes.js";
import adsPublicRoutes from "./adsPublicRoutes.js";
import communityRoutes from "./communityRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import contactRoutes from "./contactRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;

// ── Security headers ────────────────────────────────────────────────────────
// Helmet defaults are strict — loosen only what the app actually needs.
// The backend serves a JSON API; these headers mainly affect the root page and /favicon.ico.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // CSP is managed by the frontend (Vite injects its own)
}));

// ── Item 1: CORS — env-driven origin ────────────────────────────────────────
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
const allowedOrigins = ALLOWED_ORIGIN.split(",").map((o) => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

// ── Favicon — serve UniEasy logo for browser tab ────────────────────────────
app.get("/favicon.ico", (_req, res) => {
  res.sendFile(join(__dirname, "favicon.png"), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800" },
  });
});

// ── Item 19: Root route — JSON status (no HTML) ─────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    service: "Unieasy Explorer Hub API",
    version: "1.0.0",
    status: "running",
    docs: "/api/places",
  });
});

// ── Request logging ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, "incoming request");
  next();
});

// ── Health check (legacy) ───────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Item 5: Liveness probe — verify DB connectivity ─────────────────────────
app.get("/healthz", async (_req, res) => {
  try {
    const { error } = await supabaseAdmin.from("places").select("id").limit(1);
    if (error) throw error;
    res.status(200).json({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, "Health check DB probe failed");
    res.status(503).json({ status: "error", db: "unreachable", message: err.message });
  }
});

// ── Readiness probe — can we reach DB and storage? ──────────────────────────
app.get("/readyz", async (_req, res) => {
  const checks = { db: false, storage: false };
  try {
    // DB connectivity: query a small table
    const { error: dbErr } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .limit(1);
    checks.db = !dbErr;

    // Storage connectivity: list buckets
    const { error: storageErr } = await supabaseAdmin.storage.listBuckets();
    checks.storage = !storageErr;

    const allOk = checks.db && checks.storage;
    res.status(allOk ? 200 : 503).json({ ok: allOk, checks });
  } catch (err) {
    logger.error({ err }, "/readyz failed");
    res.status(503).json({ ok: false, checks, error: err.message });
  }
});

// ── Places routes (/api/places/*) — public, no auth required ────────────────
app.use("/api", placesRoutes);

// ── Ads public routes (/api/ads/*) — public, no auth required ───────────────
app.use("/api", adsPublicRoutes);

// ── Admin routes (/api/admin/*) ─────────────────────────────────────────────
app.use("/api/admin", adminRoutes);

// ── Superadmin routes (/api/superadmin/*) ───────────────────────────────────
app.use("/api/superadmin", superadminRoutes);

// ── Merchant routes (/api/merchant/*) ───────────────────────────────────────
app.use("/api/merchant", merchantRoutes);

// ── Review routes (/api/reviews/*) ──────────────────────────────────────────
app.use("/api", reviewRoutes);

// ── Reaction routes (/api/reactions/*) ──────────────────────────────────────
app.use("/api", reactionRoutes);

// ── Sentiment routes (/api/sentiment/*) ─────────────────────────────────────
app.use("/api", sentimentRoutes);

// ── Community routes (/api/community/*) ─────────────────────────────────────
app.use("/api", communityRoutes);

// ── Notification routes (/api/notifications/*) ─────────────────────────────
app.use("/api", notificationRoutes);
app.use("/api", contactRoutes);

// ── Sentry error handler (must be after routes, before custom error handler) ─
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  // Multer file upload errors — return user-friendly message
  if (err.name === "MulterError") {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "File too large (max 5 MB)" : err.message;
    return res.status(400).json({ error: msg });
  }
  // Multer custom errors (e.g., "Only image files are allowed")
  if (err.message && err.message.includes("image files")) {
    return res.status(400).json({ error: err.message });
  }
  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "Not allowed by CORS" });
  }

  logger.error({ err }, "Unhandled error");
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  res.status(500).json({ error: "Internal server error" });
});

// ── 404 fallback ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Item 4: Start with graceful shutdown ────────────────────────────────────
const server = app.listen(PORT, () => {
  logger.info(`UniEasy Server running on http://localhost:${PORT}`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received — starting graceful shutdown`);
  server.close(() => {
    logger.info("All connections closed. Server stopped.");
    process.exit(0);
  });
  setTimeout(() => {
    logger.error("Graceful shutdown timed out — forcing exit");
    process.exit(1);
  }, 10_000);
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
