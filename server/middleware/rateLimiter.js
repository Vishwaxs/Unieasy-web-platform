// server/middleware/rateLimiter.js
// Tiered rate limiters for different endpoint categories.
import rateLimit from "express-rate-limit";

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const isProd = process.env.NODE_ENV === "production";
const WINDOW_MS = parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000);

// Defaults are tuned for production traffic while still protecting backend resources.
const LIST_LIMIT_PER_WINDOW = parsePositiveInt(
  process.env.RATE_LIMIT_LIST_MAX,
  isProd ? 300 : 120,
);
const DETAIL_LIMIT_PER_WINDOW = parsePositiveInt(
  process.env.RATE_LIMIT_DETAIL_MAX,
  isProd ? 120 : 30,
);
const PHOTO_LIMIT_PER_WINDOW = parsePositiveInt(
  process.env.RATE_LIMIT_PHOTO_MAX,
  isProd ? 300 : 200,
);

/** List endpoints — higher limit for browsing. */
export const listLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: LIST_LIMIT_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

/** Detail endpoints — moderate limit. */
export const detailLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: DETAIL_LIMIT_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

/** Photo proxy — moderate limit, heavy resources. */
export const photoLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: PHOTO_LIMIT_PER_WINDOW,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});
