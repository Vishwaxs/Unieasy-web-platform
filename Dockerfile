FROM cgr.dev/chainguard/node:latest-dev AS frontend-build

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .

# Build-time public env vars for Vite (required in Dockerized production builds)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_BASE_URL
ARG VITE_SENTRY_DSN
ARG VITE_GOOGLE_MAPS_EMBED_KEY

# Optional fallbacks from non-VITE vars if your platform only provides backend names
ARG SUPABASE_URL
ARG SUPABASE_ANON_KEY
ARG CLERK_PUBLISHABLE_KEY

RUN export VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-$SUPABASE_URL}" \
 && export VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY}" \
 && export VITE_CLERK_PUBLISHABLE_KEY="${VITE_CLERK_PUBLISHABLE_KEY:-$CLERK_PUBLISHABLE_KEY}" \
 && test -n "$VITE_SUPABASE_URL" \
 && test -n "$VITE_SUPABASE_ANON_KEY" \
 && test -n "$VITE_CLERK_PUBLISHABLE_KEY" \
 && npm run build

FROM cgr.dev/chainguard/node:latest-dev AS backend-deps

WORKDIR /app/server
COPY server/package*.json ./
COPY server/setup.sh ./setup.sh
RUN /bin/sh ./setup.sh

FROM cgr.dev/chainguard/node:latest

WORKDIR /app
ENV NODE_ENV=production

# Frontend build output for Express static hosting
COPY --from=frontend-build /app/dist ./dist

# Backend source + production node_modules
COPY server ./server
COPY --from=backend-deps /app/server/node_modules ./server/node_modules

WORKDIR /app/server
EXPOSE 8080
CMD ["index.js"]
