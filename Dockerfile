# Base stage - Setup Node.js and pnpm
# Node version is read from .nvmrc at build time via NODE_VERSION build arg
ARG NODE_VERSION=22.20.0
FROM node:${NODE_VERSION}-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

WORKDIR /app

# Dependencies stage - Install production dependencies only
FROM base AS deps

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --production --ignore-scripts

# Dev dependencies stage - Install all dependencies
FROM base AS deps-dev

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --ignore-scripts

# Build stage - Compile TypeScript
FROM deps-dev AS build

COPY . .

RUN pnpm run build:ci

# Production stage - Minimal runtime image
FROM base AS production

ENV NODE_ENV=production

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY package.json ./

# Copy environment config file (public, non-secret)
COPY .env.production ./

# Create data directory and set permissions for node user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Run as non-root user for security
USER node

CMD ["node", "dist/index.js"]

# Development stage - Full dev environment with hot reload
FROM deps-dev AS development

ENV NODE_ENV=development

COPY . .

# Create data directory and set permissions for node user
RUN mkdir -p /app/data && chown -R node:node /app/data

# Run as non-root user for security
USER node

CMD ["pnpm", "run", "dev"]

