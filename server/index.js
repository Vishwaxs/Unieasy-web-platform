// server/index.js
// Express server for UniEasy admin API.
// Reads env from server/.env.local via dotenv.
import "./loadEnv.js"
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import logger from "./lib/logger.js";
import "./lib/sentry.js";
import { Sentry } from "./lib/sentry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import adminRoutes from "./adminRoutes.js";
import merchantRoutes from "./merchantRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;

// ── Security headers ────────────────────────────────────────────────────────
app.use(helmet());

// ── Rate limiting ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});
app.use("/api/", apiLimiter);

// ── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

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

// ── Request logging ─────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, "incoming request");
  next();
});

// ── Health check (legacy) ───────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Liveness probe — is the process up? ─────────────────────────────────────
app.get("/healthz", (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), time: new Date().toISOString() });
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

// ── Admin routes (/api/admin/*) ─────────────────────────────────────────────
app.use("/api/admin", adminRoutes);

// ── Merchant routes (/api/merchant/*) ───────────────────────────────────────
app.use("/api/merchant", merchantRoutes);

// ── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  logger.error({ err }, "Unhandled error");
  if (process.env.SENTRY_DSN) Sentry.captureException(err);
  res.status(500).json({ error: "Internal server error" });
});

// ── 404 fallback ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`UniEasy Server running on http://localhost:${PORT}`);
});
