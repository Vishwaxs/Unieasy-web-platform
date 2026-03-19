FROM cgr.dev/chainguard/node:latest-dev AS deps

WORKDIR /app

# Copy dependency manifests first for better layer caching.
COPY package*.json ./
COPY setup.sh ./setup.sh
RUN /bin/sh ./setup.sh

# Copy the rest of the server source.
COPY . .

FROM cgr.dev/chainguard/node:latest

WORKDIR /app
COPY --from=deps /app /app

ENV NODE_ENV=production
EXPOSE 8080

# Railway sets PORT at runtime; server/index.js reads process.env.PORT.
CMD ["index.js"]
