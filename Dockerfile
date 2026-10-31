# syntax=docker/dockerfile:1

# Campusly as a Node server (Next.js standalone output), with the Chromium the
# tutor's PDF report is printed by (lib/pdf-serveur). Built by
# .github/workflows/docker.yml, run by docker-compose.yml.

FROM node:24-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* are written into the browser's code at build time, so they
# are build arguments; every other variable is read when the server runs.
ARG NEXT_PUBLIC_APP_URL=https://www.mycampusly.fr
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ARG NEXT_PUBLIC_PRESSING_WHATSAPP
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY \
    NEXT_PUBLIC_PRESSING_WHATSAPP=$NEXT_PUBLIC_PRESSING_WHATSAPP \
    NEXT_TELEMETRY_DISABLED=1
# The build loads every route, and the database client refuses to load
# without a URL. Nothing connects to it: pages that read the database are
# rendered when they are requested.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build npm run build

FROM node:24-bookworm-slim AS runner
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium fonts-liberation fonts-noto-core fonts-noto-color-emoji ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    CHROME_PATH=/usr/bin/chromium
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/auth/providers').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"
CMD ["node", "server.js"]
