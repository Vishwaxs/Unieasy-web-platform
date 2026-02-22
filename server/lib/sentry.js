// server/lib/sentry.js
// Sentry error-tracking initialisation.
// Set SENTRY_DSN in server/.env.local to enable.
// If SENTRY_DSN is absent, this module is a no-op.

import * as Sentry from "@sentry/node";
import logger from "./logger.js";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.2, // adjust in production
  });
  logger.info("Sentry initialised");
} else {
  logger.warn("SENTRY_DSN not set — error tracking disabled");
}

export { Sentry };
