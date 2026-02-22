// server/lib/logger.js
// Structured logging via pino.
// In dev, pino-pretty is used for human-readable output.
// In production, JSON logs are emitted for ingestion by log aggregators.

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "SYS:HH:MM:ss" },
        },
      }
    : {}),
});

export default logger;
