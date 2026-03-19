#!/bin/sh
set -eu

# Install production dependencies for the API service.
npm ci --omit=dev --no-audit --no-fund
