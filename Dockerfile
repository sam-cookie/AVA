FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# ── Install dependencies ──────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build the Next.js app ─────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
ENV TURSO_DATABASE_URL=file:/tmp/build.db
ENV AUTH_SECRET=build-placeholder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Migrate the temp DB before building — Next.js pre-renders pages that query
# the DB, so tables must exist or the build fails with "no such table".
RUN node scripts/build-migrate.mjs && pnpm build

# ── Production image ──────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p /app/data && chown nextjs:nodejs /app/data

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# drizzle-orm is bundled into Next.js chunks and absent from standalone node_modules.
# Copy it explicitly so the migration script can import it at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@libsql ./node_modules/@libsql

# Migration files + runner — executed by entrypoint before server starts
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db/migrations ./migrations
COPY --chown=nextjs:nodejs scripts/docker-migrate.mjs ./docker-migrate.mjs
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/app/docker-entrypoint.sh"]
