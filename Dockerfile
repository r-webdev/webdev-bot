ARG NODE_VERSION=22.20.0
FROM node:${NODE_VERSION}-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

WORKDIR /app

# --- Production dependencies only ---
FROM base AS deps

RUN apk add --no-cache python3 make g++

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --production

# --- Full dependencies ---
FROM base AS deps-dev

RUN apk add --no-cache python3 make g++

ENV PRISMA_SKIP_POSTINSTALL_GENERATE=1

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --- Build ---
FROM deps-dev AS build

# These files are required by prisma.config.ts.
# Keeping them separate allows Prisma generate to be cached
# when only application source code changes.
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json ./
COPY src/loadEnvFile.ts ./src/loadEnvFile.ts

ENV DATABASE_URL="file:/tmp/build.db"

RUN pnpm exec prisma generate

COPY . .

RUN pnpm run build

# --- Production runtime ---
FROM base AS production

ENV NODE_ENV=production

# Production dependencies
COPY --from=deps --chown=node:node \
    /app/node_modules ./node_modules

COPY --from=build --chown=node:node \
    /app/src/generated/prisma ./src/generated/prisma

COPY --from=build /app/dist ./dist
COPY package.json ./
COPY .env.production ./

COPY --from=build /app/assets ./assets
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/src/loadEnvFile.ts ./src/loadEnvFile.ts

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