// server/middleware/rateLimiter.js
// Tiered rate limiters for different endpoint categories.
import rateLimit from "express-rate-limit";

/** List endpoints — higher limit for browsing. */
export const listLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
});

/** Detail endpoints — moderate limit. */
export const detailLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
});

/** Photo proxy — moderate limit, heavy resources. */
export const photoLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
});
