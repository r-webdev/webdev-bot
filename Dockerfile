ARG NODE_VERSION=22.20.0
FROM node:${NODE_VERSION}-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate
WORKDIR /app

# --- Production dependencies only ---
FROM base AS deps
RUN apk add --no-cache python3 make g++
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --production

# --- Full dependencies (build tools included) ---
FROM base AS deps-dev
RUN apk add --no-cache python3 make g++
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM deps-dev AS build
COPY . .
ENV DATABASE_URL="file:/tmp/build.db"
RUN pnpm exec prisma generate
RUN pnpm run build

# --- Production runtime ---
FROM base AS production
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

COPY --from=build /app/dist ./dist
COPY package.json ./
COPY .env.production ./
COPY --from=build /app/assets ./assets
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
CMD ["node", "dist/index.js"]

# --- Development ---
FROM deps-dev AS development
ENV NODE_ENV=development
COPY . .
RUN pnpm exec prisma generate
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node
CMD ["pnpm", "run", "dev"]