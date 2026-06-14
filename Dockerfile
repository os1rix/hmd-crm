# syntax=docker/dockerfile:1

FROM node:22-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["node", "scripts/start.mjs", "--dev"]

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN mkdir -p public
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=deps /app/node_modules ./db-setup/node_modules
COPY --from=builder /app/drizzle ./db-setup/drizzle
COPY --from=builder /app/drizzle.config.ts ./db-setup/drizzle.config.ts
COPY --from=builder /app/scripts/seed.ts ./db-setup/scripts/seed.ts
COPY --from=builder /app/src/db ./db-setup/src/db
COPY --from=builder /app/package.json ./db-setup/package.json
COPY --from=builder /app/db-setup/setup.mjs ./db-setup/setup.mjs
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start.mjs ./scripts/start.mjs
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "scripts/start.mjs"]
