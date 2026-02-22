// server/index.js
// Express server for UniEasy admin API.
// Reads env from server/.env.local via dotenv.
import "./loadEnv.js"
import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load server/.env.local
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env.local") });

import adminRoutes from "./adminRoutes.js";

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// ── Admin routes (/api/admin/*) ─────────────────────────────────────────────
app.use("/api/admin", adminRoutes);

// ── 404 fallback ────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[UniEasy Server] Running on http://localhost:${PORT}`);
});
